import fs from "node:fs";
import path from "node:path";

class LoggingService {
  private logger: fs.WriteStream | null = null;
  private readonly baseDir: string;
  private readonly defaultDirName = "excel_database";

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  public createLoggingStream(excelName: string) {
    const excelBaseName = excelName.split(".")[0];
    const logDir = path.join(this.baseDir, this.defaultDirName, excelBaseName);

    const today = new Date();
    const dateString = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, "0")}_${String(
      today.getDate()
    ).padStart(2, "0")}`;

    const logFileName = `${dateString}_logs.txt`;
    const logFilePath = path.join(logDir, logFileName);

    // 로그 디렉토리 생성
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logger = fs.createWriteStream(logFilePath, { flags: "a" });
    } catch (error) {
      this.errorLogging("로그 파일 생성 실패", error);
      this.logger = null;
    }
  }

  public logging(message: string) {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
      2,
      "0"
    )}:${String(now.getSeconds()).padStart(2, "0")}`;

    const logMessage = `[${timeString}]: ${message}`;
    console.log(logMessage);

    if (this.logger) {
      this.logger.write(`${logMessage}\n`);
    }
  }

  public errorLogging(message: string, error: unknown) {
    const errorDetails =
      error instanceof Error
        ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        : JSON.stringify(error, null, 2);

    this.logging(`${message}\n${errorDetails}`);
  }

  public save() {
    if (this.logger) {
      this.logger.write("\n종료\n");
      this.logger.end();
      this.logger = null;
    }
  }
}

export default LoggingService;
