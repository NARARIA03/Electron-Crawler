import * as XLSX from "xlsx-js-style";
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
  private wb: XLSX.WorkBook;
  private filePath: string;
  private readonly defaultDirName = "excel_database";

  constructor(baseDir: string, excelName: string) {
    const excelBaseName = excelName.split(".")[0];
    const excelDir = path.join(baseDir, this.defaultDirName, excelBaseName);
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true });
    }

    this.filePath = path.join(excelDir, excelName);

    if (fs.existsSync(this.filePath)) {
      this.wb = XLSX.readFile(this.filePath);
    } else {
      this.wb = XLSX.utils.book_new();

      const ws = XLSX.utils.aoa_to_sheet([["검색어", "기관명", "정보제목", "파일링크"]]);
      XLSX.utils.book_append_sheet(this.wb, ws, "Sheet1");
      this.save();
    }
  }

  public addRow() {
    const ws = this.wb.Sheets["Sheet1"];
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:D1");
    const newRowIndex = range.e.r + 1;

    const rowNum = newRowIndex + 1;
    const cellA = `A${rowNum}`;
    const cellB = `B${rowNum}`;
    const cellC = `C${rowNum}`;
    const cellD = `D${rowNum}`;

    const rangeUpdator = () => {
      const newRange = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: 3, r: newRowIndex },
      });
      ws["!ref"] = newRange;
    };

    return {
      success: ({ query, organization, title, fileLink }: TSuccessParams) => {
        ws[cellA] = { t: "s", v: query };
        ws[cellB] = { t: "s", v: organization };
        ws[cellC] = { t: "s", v: title };
        ws[cellD] = {
          t: "s",
          v: "파일 열기",
          l: { Target: fileLink, Tooltip: "클릭하여 파일 열기" },
          s: { font: { color: { rgb: "0000FF" }, underline: true } },
        };

        rangeUpdator();
        this.save();
      },
      error: ({ query, organization, title, message }: TErrorParams) => {
        ws[cellA] = { t: "s", v: query };
        ws[cellB] = { t: "s", v: organization };
        ws[cellC] = { t: "s", v: title };
        ws[cellD] = {
          t: "s",
          v: message,
          s: { font: { color: { rgb: "FF0000" } } },
        };

        rangeUpdator();
        this.save();
      },
    };
  }

  private autoFitColumns() {
    const ws = this.wb.Sheets["Sheet1"];
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:D1");

    const colWidths: number[] = [];

    // 각 열별로 최대 너비 계산
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 8; // 최소 너비

      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
        const cell = ws[cellAddress];

        if (cell && cell.v) {
          const cellValue = String(cell.v);
          let width = 0;
          for (const char of cellValue) {
            // 한글, 한자, 일본어 등 2바이트 문자는 2배 너비
            width += char.match(/[\u3131-\uD79D]/) ? 2 : 1;
          }
          maxWidth = Math.max(maxWidth, width);
        }
      }

      colWidths[C] = maxWidth + 5; // 여백 +5
    }

    // 열 너비 설정
    ws["!cols"] = colWidths.map((w) => ({ wch: w }));
  }

  public save() {
    this.autoFitColumns();
    XLSX.writeFile(this.wb, this.filePath, { bookSST: false, cellStyles: true });
  }

  public getFilePath(): string {
    return this.filePath;
  }
}

export default XlsxService;
