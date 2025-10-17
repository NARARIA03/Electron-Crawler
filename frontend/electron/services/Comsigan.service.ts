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
  }
}

export default ComsiganService;
