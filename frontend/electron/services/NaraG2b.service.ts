import puppeteer, { Browser } from "puppeteer";
import fs from "node:fs";
import path from "node:path";

export type NaraG2bCrawlData = {
  query: string; // 검색어 - 신발장
  startDate: string;
  endDate: string;
  organization?: string; // 기관명 - 개운중학교
  location?: string; // 지역명 - 서울특별시교육청
};

class NaraG2bService {
  private browser: Browser | null = null;
  private logStream: fs.WriteStream | null = null;

  private async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: false, // 개발 중에는 false, 배포 시 true로 변경
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
  }

  public async crawl(data: NaraG2bCrawlData[], baseDir: string, excelName: string, debug: boolean = false) {
    if (!this.browser) {
      await this.initialize();
    }

    // 로그 설정
    if (debug) {
      this.setupLogging(baseDir, excelName);
    }

    try {
      for (const crawlData of data) {
        this.log(`검색 시작: ${crawlData.searchKeyword}`);
        const pageResults = await this.crawlSingleSearch(crawlData);

        this.log(`검색 완료: ${pageResults.length}개 결과`);

        // 요청 간 딜레이
        await this.delay(1000);
      }

      // 결과를 Excel로 저장
    } catch (error) {
      this.log(`크롤링 오류: ${error}`);
      throw error;
    } finally {
      if (this.logStream) {
        this.logStream.end();
      }
    }
  }

  private async crawlSingleSearch(data: NaraG2bCrawlData) {}

  private async saveToExcel(results: NaraG2bResult[], baseDir: string, excelName: string) {}

  private setupLogging(baseDir: string, excelName: string): void {
    const defaultDirName = "excel_database";
    const excelBaseName = excelName.split(".")[0];
    const logDir = path.join(baseDir, defaultDirName, excelBaseName);

    const today = new Date();
    const dateString = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, "0")}_${String(
      today.getDate()
    ).padStart(2, "0")}`;
    const logFileName = `${dateString}_logs.txt`;
    const logFilePath = path.join(logDir, logFileName);

    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logStream = fs.createWriteStream(logFilePath, { flags: "a" });
    } catch (error) {
      console.error(`로그 파일 생성 실패: ${error}`);
    }
  }

  private log(message: string): void {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
      2,
      "0"
    )}:${String(now.getSeconds()).padStart(2, "0")}`;

    const logMessage = `[${timeString}]: ${message}`;
    console.log(logMessage);

    if (this.logStream) {
      this.logStream.write(`${logMessage}\n`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }
}

export default NaraG2bService;
