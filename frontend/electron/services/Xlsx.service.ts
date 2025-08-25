import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

type TBaseParams = {
  query: string;
  organization: string;
  title: string;
};

type TSuccessParams = TBaseParams & {
  fileLink: string;
};

type TErrorParams = TBaseParams & {
  message: string;
};

class XlsxService {
  private wb: ExcelJS.Workbook;
  private ws: ExcelJS.Worksheet;
  private filePath: string;
  private readonly defaultDirName = "excel_database";

  constructor(baseDir: string, excelName: string) {
    const excelBaseName = excelName.split(".")[0];
    const excelDir = path.join(baseDir, this.defaultDirName, excelBaseName);
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true });
    }

    this.filePath = path.join(excelDir, excelName);
    this.wb = new ExcelJS.Workbook();
    this.ws = this.wb.addWorksheet("Sheet1", { pageSetup: { fitToPage: true } });
    this.ws.addRow(["검색어", "기관명", "정보제목", "파일링크"]);
  }

  public async addRow({ query, organization, title, fileLink }: TSuccessParams) {
    const row = this.ws.addRow([query, organization, title, "파일 열기"]);

    const linkCell = row.getCell(4);
    linkCell.value = { text: "파일 열기", hyperlink: fileLink };
    linkCell.font = { underline: true, color: { theme: 10 } };

    await this.save();
  }

  public async addErrorRow({ query, organization, title, message }: TErrorParams) {
    const row = this.ws.addRow([query, organization, title, message]);

    const errorCell = row.getCell(4);
    errorCell.font = { color: { argb: "FFFF0000" } };

    await this.save();
  }

  private autoFitColumns() {
    const colWidths: number[] = [];

    this.ws.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const cellValue = cell.value ? String(cell.value) : "";
        let cellWidth = 0;

        for (const char of cellValue) {
          cellWidth += /[\u3131-\uD79D]/.test(char) ? 2 : 1;
        }
        colWidths[colNumber - 1] = Math.max(colWidths[colNumber - 1] || 10, cellWidth + 2);
      });
    });

    this.ws.columns = colWidths.map((width) => ({ width }));
  }

  public async save() {
    this.autoFitColumns();
    await this.wb.xlsx.writeFile(this.filePath);
  }

  public getFilePath(): string {
    return this.filePath;
  }
}

export default XlsxService;
