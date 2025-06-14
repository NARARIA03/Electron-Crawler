import * as XLSX from "xlsx";

export const parseExcelQuery = async (excelFile: File): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const sheetRange = XLSX.utils.decode_range(ws["!ref"]!);

        const result = [];

        for (let row = 5; row <= sheetRange.e.r; row++) {
          const rowData = {
            query: getRequiredCellValue(ws, row, 0),
            organization: getRequiredCellValue(ws, row, 1),
            location: getRequiredCellValue(ws, row, 2),
            include: getNullableCellValue(ws, row, 3),
            exclude: getNullableCellValue(ws, row, 4),
            startDate: getRequiredCellValue(ws, row, 5),
            endDate: getRequiredCellValue(ws, row, 6),
          };
          result.push(rowData);
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(excelFile);
  });
};

const getRequiredCellValue = (ws: XLSX.WorkSheet, row: number, col: number): string => {
  const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
  const cell = ws[cellAddress];

  if (!cell || cell.v === undefined || cell.v === null || String(cell.v).trim() === "") {
    throw new Error(`필수값 누락 (행 ${row + 1}열 ${col + 1})`);
  }
  return String(cell.v).trim();
};

const getNullableCellValue = (ws: XLSX.WorkSheet, row: number, col: number): string | "null" => {
  const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
  const cell = ws[cellAddress];

  if (!cell || cell.v === undefined || cell.v === null || String(cell.v).trim() === "") {
    return "null";
  }
  return String(cell.v).trim();
};
