import puppeteer, { Browser } from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import LoggingService from "./Logging.service";
import XlsxService from "./Xlsx.service";
import { app } from "electron";

export type ComsiganCrawlData = {
  schoolName: string;
  region: string;
  teacherName: string;
};

type Params = {
  data: ComsiganCrawlData[];
  excelName: string;
  baseDir: string;
  debug: boolean;
};

class ComsiganService {
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
    const pathName = this.excelName.split(".")[0].toLowerCase().replaceAll("query", "") || "default-result-comsigan";
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
          "--disable-features=HttpsFirstBalancedModeAutoEnable", // HTTPS 안 되는 사이트 접근 시 뜨는 경고 무시하는 flag
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

  private async query({ schoolName, region, teacherName }: ComsiganCrawlData) {
    if (!this.browser) throw new Error("브라우저 초기화 실패");
    if (!this.loggingService) throw new Error("에러 로깅 서비스 초기화 실패");
    if (!this.xlsxService) throw new Error("xlsx 서비스 초기화 실패");

    const page = await this.browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });
    await page.goto("http://xn--s39aj90b0nb2xw6xh.kr/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    this.loggingService.logging("페이지 로딩 완료");

    const targetIFrame = page.frames().find((frame) => frame.url().includes("comci.net:4082/st"));
    if (!targetIFrame) throw new Error("대상 frame을 찾을 수 없습니다");
    this.loggingService.logging("iframe 내부 접근 성공");

    await targetIFrame.locator("input#sc").fill(schoolName);
    this.loggingService.logging("학교명 입력 완료");
    await targetIFrame.locator('input[value="검색"]').click();
    this.loggingService.logging("검색 버튼 클릭 완료");
    await page.waitForNetworkIdle({ idleTime: 1000 });

    this.loggingService.logging("검색 결과에서 학교를 찾아 클릭 시도");
    const isSuccess = await targetIFrame.evaluate(
      (targetSchoolName, targetRegion) => {
        const table = document.querySelector("table#학교명단검색");
        const searchResults = Array.from(table?.querySelectorAll("tbody tr") ?? []);

        for (const row of searchResults) {
          const cells = row.querySelectorAll("td");
          if (cells.length < 2) continue;
          const regionText = cells[0]?.innerText?.trim() ?? "";
          const link = cells[1]?.querySelector("a");
          const schoolText = link?.innerText?.trim() ?? "";

          if (regionText.includes(targetRegion) && schoolText.includes(targetSchoolName)) {
            link?.click();
            return true;
          }
        }
        return false;
      },
      schoolName,
      region
    );

    if (!isSuccess) throw new Error(`${region}-${schoolName} 검색 결과가 없습니다.`);
    this.loggingService.logging(`학교 선택 완료. 지역: ${region}, 학교명: ${schoolName}`);
    await page.waitForNetworkIdle({ idleTime: 1000 });

    const rawWeekOptions = await targetIFrame.$$eval("select#nal option", (options) =>
      options.map((option) => {
        const value = option.value;
        const dateTexts = option.textContent?.match(/(\d{2})-(\d{2})-(\d{2})\s*~\s*(\d{2})-(\d{2})-(\d{2})/);
        if (!dateTexts) throw new Error("날짜 형식이 변경되었을 가능성이 있습니다. 관리자에게 문의해주세요.");

        const [, startYear, startMonth, startDay, endYear, endMonth, endDay] = dateTexts;
        const startDate = new Date(2000 + parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
        const endDate = new Date(2000 + parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay) - 1); // * 일자가 6일제로 되어있어서 -1일

        return {
          value,
          text: option.textContent,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
        };
      })
    );

    const weekOptions = rawWeekOptions.map(({ value, text, startTime, endTime }) => ({
      value,
      text,
      startDate: new Date(startTime),
      endDate: new Date(endTime),
    }));

    const MAX_ATTEMPTS = 30;
    let attempts = 0;
    let collectedDays = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (collectedDays < 5 && attempts < MAX_ATTEMPTS) {
      attempts++;
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const curDateStr = `${year}-${month}-${day}`;

      this.loggingService.logging(`${curDateStr} 날짜 데이터 수집 시도 (${attempts}/${MAX_ATTEMPTS})`);

      const matchedWeek = weekOptions.find(
        ({ startDate, endDate }) => currentDate >= startDate && currentDate <= endDate
      );

      if (!matchedWeek) {
        this.loggingService.logging(`${curDateStr}가 범위에 존재 X, 다음날로 이동`);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      this.loggingService.logging(`${curDateStr}가 범위에 존재 O, 범위에 해당하는 주간 선택 시도`);
      await targetIFrame.select("select#nal", matchedWeek.value);
      await page.waitForNetworkIdle({ idleTime: 1000 });

      // TODO: 데이터 파싱
      this.loggingService.logging(`데이터 파싱 예정 (${collectedDays + 1}/5일차)`);
      // 수집 완료
      collectedDays++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (collectedDays < 5) throw new Error(`${collectedDays}일치만 수집됨. ${MAX_ATTEMPTS}번 시도 후 종료`);
    this.loggingService.logging("5일치 데이터 수집 완료");

    await this.delay(10000);
  }
}

export default ComsiganService;
