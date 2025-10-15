import ExcelJS from "exceljs";
import type { NaraG2bDataFE } from "../types";

export const parseExcelQuery = async (excelFile: File): Promise<NaraG2bDataFE[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(arrayBuffer);

        const ws = wb.getWorksheet(1);
        if (!ws) throw new Error("워크시트를 찾을 수 없습니다");

        const result: NaraG2bDataFE[] = [];

        ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber >= 6) {
            const rowData = {
              query: getCellValue(row, 1),
              organization: getCellValue(row, 2),
              region: getCellValue(row, 3),
              startDate: getCellValue(row, 4),
              endDate: getCellValue(row, 5),
            };
            result.push(rowData);
          }
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(excelFile);
  });
};

const getCellValue = (row: ExcelJS.Row, col: number): string => {
  const cell = row.getCell(col);
  const value = cell.value;

  if (!value || value === null || String(value).trim() === "") {
    throw new Error(`필수값 누락 (행 ${row.number}열 ${col})`);
  }
  return String(value).trim();
};
