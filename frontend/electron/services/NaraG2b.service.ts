import puppeteer, { Browser } from "puppeteer";
import LoggingService from "./Logging.service";

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

  public async crawl() {
    for (const crawlData of this.data) {
      try {
        await this.setUp();
        if (!this.browser) throw new Error("브라우저 초기화 실패");
        if (!this.loggingService) throw new Error("에러 로깅 서비스 초기화 실패");
        // 각 데이터 하나에 대한 크롤링 메서드 작성 예정
      } catch (error) {
        // 예외 처리?
      } finally {
        await this.close();
      }
    }
  }
}

export default NaraG2bService;
