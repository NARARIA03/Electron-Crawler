import ExcelJS from "exceljs";
import type { ComsiganDataFE } from "../types";

export const parseExcelQuery = (excelFile: File): Promise<ComsiganDataFE[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(arrayBuffer);

        const ws = wb.getWorksheet(1);
        if (!ws) throw new Error("워크시트를 찾을 수 없습니다");

        const result: ComsiganDataFE[] = [];

        ws.eachRow({ includeEmpty: true }, (row, rowNum) => {
          if (rowNum >= 3) {
            result.push({
              schoolName: getCellValue(row, 1),
              region: getCellValue(row, 2),
              teacherName: getCellValue(row, 3),
            });
          }
        });
        resolve(result);
      } catch (e) {
        reject(e);
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
