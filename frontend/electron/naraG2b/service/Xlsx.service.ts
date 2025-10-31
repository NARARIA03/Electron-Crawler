import { autoFitColumns } from "../../shared/utils/autoFitColumns";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

type TBaseParams = {
  query: string;
  organization: string;
  title: string;
};

type TSuccessParams = TBaseParams & {
  createdAt: string;
  fileLink: string;
};

type TErrorParams = TBaseParams & {
  message: string;
};

export default class XlsxService {
  private wb: ExcelJS.Workbook;
  private ws: ExcelJS.Worksheet | null;
  private filePath: string;
  private readonly sheetName = "Sheet1";

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
    const ws = this.wb.addWorksheet(this.sheetName, { pageSetup: { fitToPage: true } });
    ws.addRow(["검색어", "기관명", "정보제목", "사업일자", "파일링크"]);
    return ws;
  }

  /**
   * @description 싱글톤 형태로 Worksheet 반환을 보장하는 메서드
   */
  private async getWorksheet() {
    if (!this.ws) {
      if (fs.existsSync(this.filePath)) {
        await this.wb.xlsx.readFile(this.filePath);
        this.ws = this.wb.getWorksheet(this.sheetName) ?? this.createWorksheet();
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
  public async addRow({ query, organization, title, createdAt, fileLink }: TSuccessParams) {
    const ws = await this.getWorksheet();
    const row = ws.addRow([query, organization, title, createdAt, "파일 열기"]);

    const linkCell = row.getCell(5);
    linkCell.value = { text: "파일 열기", hyperlink: fileLink };
    linkCell.font = { underline: true, color: { theme: 10 } };

    await this.save();
  }

  /**
   * @description 에러 발생 시 행을 추가하는 메서드
   * @note `Promise.all` 등으로 race condition을 유발하지 마세요.
   */
  public async addErrorRow({ query, organization, title, message }: TErrorParams) {
    const ws = await this.getWorksheet();
    const row = ws.addRow([query, organization, title, message]);

    const errorCell = row.getCell(4);
    errorCell.font = { color: { argb: "FFFF0000" } };

    await this.save();
  }

  /**
   * @description xlsx 파일에 데이터를 저장하는 메서드
   */
  public async save() {
    const ws = await this.getWorksheet();
    autoFitColumns(ws);
    await this.wb.xlsx.writeFile(this.filePath);
  }

  /**
   * @description xlsx 파일 경로를 반환하는 메서드
   */
  public getFilePath(): string {
    return this.filePath;
  }
}
