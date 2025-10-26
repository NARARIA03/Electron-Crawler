import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";

type TBaseParams = {
  region: string;
  schoolName: string;
  teacherName: string;
  date: string;
  time: string;
  grade: number;
  subject: string;
};

export default class XlsxService {
  private wb: ExcelJS.Workbook;
  private ws: ExcelJS.Worksheet | null;
  private filePath: string;
  private readonly baseSheet = "Default";

  /**
   * @description Workbook과 변수를 초기화하는 생성자
   */
  constructor(resultDir: string, excelName: string) {
    const resultExcelName = excelName.toLowerCase().replaceAll("query", "");

    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }

    this.filePath = path.join(resultDir, resultExcelName);
    this.wb = new ExcelJS.Workbook();
    this.ws = null;
  }

  /**
   * @description 초기 Worksheet를 생성해서 반환하는 메서드
   */
  private createWorksheet() {
    const ws = this.wb.addWorksheet(this.baseSheet, { pageSetup: { fitToPage: true } });
    ws.addRow(["지역", "학교명", "교사명", "날짜", "수업 시간", "학년", "과목"]);
    return ws;
  }

  /**
   * @description 싱글톤 형태로 Worksheet 반환을 보장하는 메서드
   */
  private async getWorksheet() {
    if (!this.ws) {
      if (fs.existsSync(this.filePath)) {
        await this.wb.xlsx.readFile(this.filePath);
        this.ws = this.wb.getWorksheet(this.baseSheet) ?? this.createWorksheet();
      } else {
        this.ws = this.createWorksheet();
      }
    }
    return this.ws;
  }

  /**
   * @description 정상 데이터 수집 후, 행을 추가하는 메서드
   * @note `Promise.all` 등으로 race condition을 유발하지 마세요.
   */
  public async addRow({ region, schoolName, teacherName, date, time, grade, subject }: TBaseParams) {
    const ws = await this.getWorksheet();
    ws.addRow([region, schoolName, teacherName, date, time, grade, subject]);
    await this.save();
  }

  /**
   * @description 저장 전 셀의 width를 맞추는 메서드
   */
  private async autoFitColumns() {
    const colWidths: number[] = [];
    const ws = await this.getWorksheet();

    ws.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const cellValue = cell.value ? String(cell.value) : "";
        let cellWidth = 0;

        for (const char of cellValue) {
          cellWidth += /[\u3131-\uD79D]/.test(char) ? 2 : 1;
        }
        colWidths[colNumber - 1] = Math.max(colWidths[colNumber - 1] || 10, cellWidth + 2);
      });
    });

    ws.columns = colWidths.map((width) => ({ width }));
  }

  /**
   * @description xlsx 파일에 데이터를 저장하는 메서드
   */
  public async save() {
    await this.autoFitColumns();
    await this.wb.xlsx.writeFile(this.filePath);
  }

  /**
   * @description xlsx 파일 경로를 반환하는 메서드
   */
  public getFilePath(): string {
    return this.filePath;
  }

  /**
   * @description 데이터를 테이블 형태로 재구축하는 메서드
   */
  public createTableView() {}
}
