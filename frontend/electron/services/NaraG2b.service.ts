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
        await this.query(crawlData);
        // 각 데이터 하나에 대한 크롤링 메서드 작성 예정
      } catch (error) {
        console.error(error);
        this.loggingService?.logging(error as string);
        // 예외 처리?
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
    await page.locator("body.has-main").wait();

    await page.$$eval('button[aria-label="창닫기"]', (buttons) => buttons.map((button) => button.click()));
    this.loggingService.logging("공지 모달 모두 닫기 성공");

    await page.locator('span[aria-label="Go to slide 2"]').click();
    this.loggingService.logging("검색ON 버튼 클릭 성공");

    await page.locator('input[title="통합상세"]').click();
    this.loggingService.logging("통합 상세 버튼 클릭 성공");

    await page.locator('input[title="검색어 입력"]').fill(query);
    this.loggingService.logging("검색어 query 입력 성공");

    const parsedStartDate = startDate.split("-").join("");
    const parsedEndDate = endDate.split("-").join("");

    await page.locator('input[title="(      ) 년월일 시작 날짜를 선택하세요."]').fill(parsedStartDate);
    this.loggingService.logging("시작 날짜 인풋 입력 성공");

    await page.locator('input[title="(      ) 년월일 종료 날짜를 선택하세요."]').fill(parsedEndDate);
    this.loggingService.logging("종료 날짜 인풋 입력 성공");

    await page.locator("a.main-srch").click();
    this.loggingService.logging("검색 버튼 클릭 성공");

    await this.delay(10000);
  }
}

export default NaraG2bService;
