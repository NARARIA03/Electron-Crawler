import puppeteer, { Browser } from "puppeteer";
import LoggingService from "./Logging.service";
import XlsxService from "./Xlsx.service";
import fs from "fs";
import path from "node:path";
import { app } from "electron";

export type NaraG2bCrawlData = {
  query: string; // 검색어 - 신발장
  startDate: string;
  endDate: string;
  organization: string; // 기관명 - 개운중학교
  region: string; // 지역 - 서울
};

type Params = {
  data: NaraG2bCrawlData[];
  excelName: string;
  baseDir: string;
  debug: boolean;
};

class NaraG2bService {
  private data: Params["data"];
  private excelName: Params["excelName"];
  private debug: Params["debug"];
  private resultDir: string;
  private filesDir: string;

  private browser: Browser | null = null;
  private xlsxService: XlsxService | null = null;
  private loggingService: LoggingService | null = null;

  constructor({ data, excelName, baseDir, debug }: Params) {
    this.data = data;
    this.excelName = excelName;
    this.debug = debug;
    const pathName = this.excelName.split(".")[0].toLowerCase().replaceAll("query", "") || "result";
    this.resultDir = path.join(baseDir, "excel_database", pathName);
    this.filesDir = path.join(this.resultDir, "files");

    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }
  }

  private getExecutablePath() {
    const chromePath = puppeteer.executablePath();

    if (app.isPackaged) {
      const idx = chromePath.indexOf(".cache");
      if (idx !== -1) {
        const relativePath = chromePath.substring(idx);
        const packagedPath = path.join(process.resourcesPath, relativePath);
        console.log("executablePath (packaged): ", packagedPath);
        return packagedPath;
      }
    }

    const unpackagedPath = chromePath.replace(/^(\.\.\/)+/, "");
    console.log("executablePath (dev): ", unpackagedPath);
    return unpackagedPath;
  }

  private async setUp() {
    console.log(this.debug);
    try {
      this.browser = await puppeteer.launch({
        headless: !this.debug,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        executablePath: this.getExecutablePath(),
      });

      this.loggingService = new LoggingService(this.resultDir);
      this.xlsxService = new XlsxService(this.resultDir, this.excelName);
      this.loggingService.logging(`엑셀 파일 생성 완료: ${this.xlsxService.getFilePath()}`);
    } catch (err) {
      console.error(err);
    }
  }

  public async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.loggingService) {
      this.loggingService.save();
      this.loggingService = null;
    }
    if (this.xlsxService) {
      await this.xlsxService.save();
      this.xlsxService = null;
    }
    await this.delay(5000);
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async crawl() {
    for (const crawlData of this.data) {
      try {
        await this.setUp();
        await this.query(crawlData);
      } catch (error) {
        this.loggingService?.errorLogging("크롤링 중 에러 발생", error);
      } finally {
        await this.close();
      }
    }
  }

  private async query({ query, startDate, endDate, organization, region }: NaraG2bCrawlData) {
    if (!this.browser) throw new Error("브라우저 초기화 실패");
    if (!this.loggingService) throw new Error("에러 로깅 서비스 초기화 실패");
    if (!this.xlsxService) throw new Error("xlsx 서비스 초기화 실패");
    if (!organization) throw new Error("organization이 비어있습니다");

    const page = await this.browser.newPage();
    await page.goto("https://www.g2b.go.kr/");
    await page.setViewport({ width: 1080, height: 1024 });

    await page.waitForSelector('button[aria-label="창닫기"]', { visible: true });
    await page.$$eval('button[aria-label="창닫기"]', (buttons) => buttons.map((button) => button.click()));
    this.loggingService.logging("공지 모달 모두 닫기 성공");

    await page.locator('span[aria-label="Go to slide 2"]').click();
    this.loggingService.logging("검색ON 버튼 클릭 성공");
    await this.delay(1000);

    await page.locator('input[title="통합상세"]').click();
    this.loggingService.logging("통합 상세 버튼 클릭 성공");
    await this.delay(1000);

    await page.locator('input[title="검색어 입력"]').fill(query);
    this.loggingService.logging("검색어 query 입력 성공");
    const inputQuery = await page.$eval('input[title="검색어 입력"]', (el) => el.value);
    this.loggingService.logging(`입력된 검색어: ${inputQuery}`);

    await page.locator('::-p-xpath(//label[text()="수요기관"]/parent::div//input[@value="검색"])').click();
    await page.waitForNetworkIdle({ idleTime: 1000 });
    this.loggingService.logging("수요기관 모달 오픈 성공");

    await page.locator('td[data-title="수요기관명"] input').fill(organization);
    this.loggingService.logging("수요기관명 입력 성공");
    const inputOrganization = await page.$eval('td[data-title="수요기관명"] input', (el) => el.value);
    this.loggingService.logging(`입력된 기관명: ${inputOrganization}`);

    await this.delay(1000);
    await page.keyboard.press("Enter");
    this.loggingService.logging("수요기관 검색 버튼 클릭 성공");

    await page.waitForSelector("#___processbar2_i", { hidden: true });
    await page.waitForNetworkIdle({ idleTime: 1000 });
    this.loggingService.logging("로딩 프로세스바 사라짐 확인");

    const isNotDeletedXPath = `//tr[td[@col_id='instDelYn']//nobr[text()='N']]`;
    const matchedXPath = `/td[@col_id='grpNm']//a[contains(text(),'${organization}') and contains(text(),'${region}')]`;

    try {
      await page.locator(`::-p-xpath(${isNotDeletedXPath}${matchedXPath})`).click();
      this.loggingService.logging("수요기관 선택 완료");
    } catch (error) {
      await this.xlsxService.addErrorRow({ query, organization, title: "", message: "수요기관 존재하지 않음" });
      throw new Error(`수요기관이 존재하지 않습니다`);
    }

    const targetOrganization =
      (await page.$eval(`::-p-xpath(${isNotDeletedXPath}${matchedXPath})`, (el) => el.textContent)) ?? organization;
    this.loggingService.logging(`선택된 수요기관명: ${targetOrganization}`);

    const parsedStartDate = startDate.split("-").join("");
    const parsedEndDate = endDate.split("-").join("");

    await page.locator('input[title="(      ) 년월일 시작 날짜를 선택하세요."]').fill(parsedStartDate);
    this.loggingService.logging("시작 날짜 인풋 입력 성공");

    await page.locator('input[title="(      ) 년월일 종료 날짜를 선택하세요."]').fill(parsedEndDate);
    this.loggingService.logging("종료 날짜 인풋 입력 성공");

    await page.locator("a.main-srch").click();
    this.loggingService.logging("검색 버튼 클릭 성공");

    await page.waitForResponse((response) => response.url().includes("srchTotal.do") && response.status() === 200);
    this.loggingService.logging("srchTotal.do API 200 성공");

    await this.delay(1000);

    await page.waitForSelector("span#mf_wfm_container_tbxTotCnt");
    const totalCnt = await page.$eval("span#mf_wfm_container_tbxTotCnt", (span) =>
      parseInt(span.innerText.replace(/,/g, ""))
    );
    this.loggingService.logging(`검색 결과: ${totalCnt}개`);

    if (totalCnt === 0) {
      await this.xlsxService.addErrorRow({
        query,
        organization: targetOrganization,
        title: "",
        message: "검색 결과 없음",
      });
      throw new Error("검색 결과가 0건입니다.");
    }

    const pageCount = Math.ceil(totalCnt / 10);
    this.loggingService.logging(`총 페이지 수: ${pageCount}개`);

    for (let i = 1; i <= pageCount; i++) {
      await page.waitForNetworkIdle({ idleTime: 1000 });
      const resultsCount = await page.$$eval(".w2textbox.link_txt", (elements) => elements.length);
      this.loggingService.logging(`현재 페이지 검색 결과 수: ${resultsCount}개`);
      for (let j = 0; j < resultsCount; j++) {
        try {
          await page.waitForNetworkIdle({ idleTime: 1000 });
          await page.waitForSelector(`#mf_wfm_container_grdTotalSrch_${j}_bizNm`, { visible: true });

          const titleSelector = `label#mf_wfm_container_grdTotalSrch_${j}_bizNm` as const;
          const createdAtSelector = `label#mf_wfm_container_grdTotalSrch_${j}_bizYmd` as const;
          const idSelector = `label#mf_wfm_container_grdTotalSrch_${j}_bizNo` as const;

          const title = await page.$eval(titleSelector, (label) => label.innerText);
          const createdAt = await page.$eval(createdAtSelector, ({ innerText }) => innerText);
          const id = await page.$eval(idSelector, ({ innerText }) => innerText);

          await page.$eval(`label#mf_wfm_container_grdTotalSrch_${j}_bizNm`, (label) => label.click());
          this.loggingService.logging(`${i}페이지 ${j + 1}번째 결과 클릭 성공`);

          await page.waitForNetworkIdle({ idleTime: 1000 });
          this.loggingService.logging("Network idle + 1000ms 대기 완료");

          await page.locator("#FIUA027_01_wframe_popupCnts_btnPrint").click();
          this.loggingService.logging("출력 버튼 클릭 완료");

          await page.waitForNetworkIdle({ idleTime: 1000 });
          this.loggingService.logging("Network idle + 1000ms 대기 완료");

          const pdfSrc = await page.evaluate(() => {
            const embeds = document.querySelectorAll("embed");
            for (const embed of embeds) {
              if (embed.src) {
                return embed.src;
              }
            }
            return null;
          });

          const base64Data = pdfSrc?.split(",")[1];
          if (base64Data) {
            const pdfBuffer = Buffer.from(base64Data, "base64");
            const filePath = path.join(this.filesDir, `${encodeURIComponent(id)}.pdf`);
            fs.writeFileSync(filePath, pdfBuffer);
            this.loggingService.logging("PDF 파일 다운 성공");
            await this.xlsxService.addRow({
              query,
              organization: targetOrganization,
              title,
              createdAt,
              fileLink: filePath,
            });
          } else {
            this.loggingService.logging("PDF 파일 다운 실패");
            await this.xlsxService.addErrorRow({
              query,
              organization: targetOrganization,
              title,
              message: "파일 다운 실패",
            });
          }
          this.loggingService.logging("엑셀에 데이터 기록 완료");

          await page.$$eval('button[aria-label="창닫기"]', (buttons) => buttons.map((button) => button.click()));
          this.loggingService.logging(`${i}페이지 ${j + 1}번째 창 닫기 성공`);
        } catch (error) {
          this.loggingService.errorLogging(`${i}페이지${j + 1}번째 결과 처리 중 오류`, error);
        }
      }
      if (i < pageCount) {
        await this.delay(1000);
        if (i % 10 === 0) {
          await page.locator("li#mf_wfm_container_pglList_next_btn").click();
        } else {
          await page.locator(`a#mf_wfm_container_pglList_page_${i + 1}`).click();
        }
      }
    }
    this.loggingService.logging(`${query}-${organization} 크롤링 완료`);
  }
}

export default NaraG2bService;
