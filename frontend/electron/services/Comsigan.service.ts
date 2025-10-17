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

    await page.waitForResponse((response) => response.url().includes("comci.net:4082") && response.status() === 200);
    this.loggingService.logging("학교명 검색 API 200 확인");

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

    await this.delay(10000);
  }
}

export default ComsiganService;
