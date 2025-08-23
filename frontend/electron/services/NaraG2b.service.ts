import puppeteer, { Browser, Page } from "puppeteer";
import LoggingService from "./Logging.service";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export type NaraG2bCrawlData = {
  query: string; // 검색어 - 신발장
  startDate: string;
  endDate: string;
  organization?: string; // 기관명 - 개운중학교
  location?: string; // 지역명 - 서울특별시교육청
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
  private baseDir: Params["baseDir"];
  private debug: Params["debug"];

  private browser: Browser | null = null;
  private loggingService: LoggingService | null = null;

  constructor({ data, excelName, baseDir, debug }: Params) {
    this.data = data;
    this.excelName = excelName;
    this.baseDir = baseDir;
    this.debug = debug;
  }

  private async setUp() {
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
    });

    this.loggingService = new LoggingService(this.baseDir);
    this.loggingService.createLoggingStream(this.excelName);
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
    await this.delay(5000);
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async captureModalToPDF(page: Page, itemIndex: number, pageIndex: number): Promise<void> {
    if (!this.loggingService) throw new Error("로깅 서비스가 초기화되지 않았습니다");

    try {
      await page.waitForSelector("#FIUA027_01_wframe", { visible: true, timeout: 10000 });

      const scrollContainer = await page.$("#FIUA027_01_wframe_popupCnts_searchFormLeft");
      if (!scrollContainer) {
        throw new Error("모달 스크롤 컨테이너를 찾을 수 없습니다");
      }

      const { scrollHeight, clientHeight } = await page.evaluate((element) => {
        return {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        };
      }, scrollContainer);

      this.loggingService.logging(`모달 높이 정보 - 전체: ${scrollHeight}px, 보이는 영역: ${clientHeight}px`);

      const screenshots: Buffer[] = [];
      const step = Math.max(clientHeight - 100, 200);

      for (let y = 0; y < scrollHeight; y += step) {
        await page.evaluate(
          (element, scrollTop) => {
            element.scrollTop = Math.min(scrollTop, element.scrollHeight - element.clientHeight);
          },
          scrollContainer,
          y
        );

        await this.delay(500);

        const screenshot = (await scrollContainer.screenshot({
          type: "png",
        })) as Buffer;
        screenshots.push(screenshot);
      }

      this.loggingService.logging(`총 ${screenshots.length}개의 스크린샷 캡쳐 완료`);

      const pdfDir = path.join(this.baseDir, "pdfs");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const pdfPath = path.join(pdfDir, `modal_page${pageIndex}_item${itemIndex}.pdf`);
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      screenshots.forEach((screenshot, index) => {
        if (index > 0) doc.addPage();

        try {
          doc.image(screenshot, 50, 50, {
            width: 500,
            align: "center",
          });
        } catch (error) {
          this.loggingService?.logging(`이미지 추가 오류 (${index}번째): ${error}`);
        }
      });

      doc.end();

      await new Promise<void>((resolve, reject) => {
        stream.on("finish", () => resolve());
        stream.on("error", reject);
      });

      this.loggingService.logging(`PDF 저장 완료: ${pdfPath}`);
    } catch (error) {
      this.loggingService.logging(`PDF 캡쳐 중 오류: ${error}`);
      throw error;
    }
  }

  public async crawl() {
    for (const crawlData of this.data) {
      try {
        await this.setUp();
        await this.query(crawlData);
      } catch (error) {
        console.error(error);
        this.loggingService?.logging(error as string);
      } finally {
        await this.close();
      }
    }
  }

  private async query({ query, startDate, endDate, organization, location }: NaraG2bCrawlData) {
    if (!this.browser) throw new Error("브라우저 초기화 실패");
    if (!this.loggingService) throw new Error("에러 로깅 서비스 초기화 실패");
    if (!location || !organization) throw new Error("location, organization이 비어있습니다");

    const page = await this.browser.newPage();
    await page.goto("https://www.g2b.go.kr/");
    await page.setViewport({ width: 1080, height: 1024 });

    await page.waitForSelector('button[aria-label="창닫기"]', { visible: true });
    await page.$$eval('button[aria-label="창닫기"]', (buttons) => buttons.map((button) => button.click()));
    this.loggingService.logging("공지 모달 모두 닫기 성공");

    await page.locator('span[aria-label="Go to slide 2"]').click();
    this.loggingService.logging("검색ON 버튼 클릭 성공");

    await page.locator('input[title="통합상세"]').click();
    this.loggingService.logging("통합 상세 버튼 클릭 성공");

    await page.locator('input[title="검색어 입력"]').fill(query);
    this.loggingService.logging("검색어 query 입력 성공");

    await page.locator('::-p-xpath(//label[text()="수요기관"]/parent::div//input[@value="검색"])').click();
    this.loggingService.logging("수요기관 모달 오픈 성공");

    await page.locator('td[data-title="수요기관명"] input').fill(organization);
    this.loggingService.logging("수요기관명 입력 성공");
    await page.keyboard.press("Enter");
    this.loggingService.logging("수요기관 검색 버튼 클릭 성공");

    await page.waitForSelector("#___processbar2_i", { hidden: true });
    this.loggingService.logging("로딩 프로세스바 사라짐 확인");

    try {
      await page.locator(`::-p-xpath(//nobr/a[contains(text(), '${location}')])`).click();
      this.loggingService.logging("수요기관 선택 완료");
    } catch (error) {
      // Todo: 엑셀에 "수요기관 존재하지 않음" 값을 기록하는 로직 추가
      throw new Error(`수요기관 "${location}"이 존재하지 않습니다`);
    }

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
    const totalCnt = await page.$eval("span#mf_wfm_container_tbxTotCnt", (span) => Number(span.innerText));
    this.loggingService.logging(`검색 결과: ${totalCnt}개`);

    if (totalCnt === 0) {
      // Todo: 엑셀에 "검색 결과 없음" 값을 기록하는 로직 추가
      throw new Error("검색 결과가 0건입니다.");
    }

    const pageCount = Math.ceil(totalCnt / 10);
    this.loggingService.logging(`총 페이지 수: ${pageCount}개`);

    for (let i = 1; i <= pageCount; i++) {
      await this.delay(1000);
      const resultsCount = await page.$$eval(".w2textbox.link_txt", (elements) => elements.length);
      this.loggingService.logging(`현재 페이지 검색 결과 수: ${resultsCount}개`);
      for (let j = 0; j < resultsCount; j++) {
        try {
          await this.delay(1000);
          await page.waitForSelector(`#mf_wfm_container_grdTotalSrch_${j}_bizNm`, { visible: true });
          await page.$eval(`label#mf_wfm_container_grdTotalSrch_${j}_bizNm`, (label) => label.click());

          this.loggingService.logging(`${i}페이지 ${j + 1}번째 결과 클릭 성공`);
          await this.delay(1000);

          await this.captureModalToPDF(page, j + 1, i);
          this.loggingService.logging(`${i}페이지 ${j + 1}번째 PDF 캡쳐 성공`);

          await page.locator('button[aria-label="창닫기"]').click();
          this.loggingService.logging(`${i}페이지 ${j + 1}번째 창 닫기 성공`);
        } catch (error) {
          this.loggingService.logging(`${i}페이지${j + 1}번째 결과 처리 중 오류: ${error}`);
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
    this.loggingService.logging(`${query}-${organization}-${location}크롤링 완료`);
  }
}

export default NaraG2bService;
