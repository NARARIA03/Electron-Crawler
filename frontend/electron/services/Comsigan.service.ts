import puppeteer, { Browser } from "puppeteer";
import LoggingService from "./Logging.service";
import XlsxService from "./Xlsx.service";

export type ComsiganCrawlData = {
  query: string; // 검색어 - 신발장
  startDate: string;
  endDate: string;
  organization?: string; // 기관명 - 개운중학교
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
  private baseDir: Params["baseDir"];
  private debug: Params["debug"];

  private browser: Browser | null = null;
  private xlsxService: XlsxService | null = null;
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

    this.loggingService = new LoggingService(this.baseDir, this.excelName);
    this.xlsxService = new XlsxService(this.baseDir, this.excelName);
    this.loggingService.logging(`엑셀 파일 생성 완료: ${this.xlsxService.getFilePath()}`);
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

  private async query({ query, startDate, endDate, organization }: ComsiganCrawlData) {
    if (!this.browser) throw new Error("브라우저 초기화 실패");
    if (!this.loggingService) throw new Error("에러 로깅 서비스 초기화 실패");
    if (!this.xlsxService) throw new Error("xlsx 서비스 초기화 실패");
    if (!organization) throw new Error("organization이 비어있습니다");
  }
}

export default ComsiganService;
