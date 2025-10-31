import ExcelJS from "exceljs";

export const parseExcelQuery = async (excelFile: File): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(arrayBuffer);

        const ws = wb.getWorksheet(1);
        if (!ws) throw new Error("워크시트를 찾을 수 없습니다");

        const result: unknown[] = [];

        // 6번째 행부터 시작
        ws.eachRow((row, rowNumber) => {
          if (rowNumber >= 6) {
            // 6번째 행부터
            const rowData = {
              query: getRequiredCellValue(row, 1),
              organization: getRequiredCellValue(row, 2),
              location: getRequiredCellValue(row, 3),
              include: getNullableCellValue(row, 4),
              exclude: getNullableCellValue(row, 5),
              startDate: getRequiredCellValue(row, 6),
              endDate: getRequiredCellValue(row, 7),
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

const getRequiredCellValue = (row: ExcelJS.Row, col: number): string => {
  const cell = row.getCell(col);
  const value = cell.value;

  if (!value || value === null || String(value).trim() === "") {
    throw new Error(`필수값 누락 (행 ${row.number}열 ${col})`);
  }
  return String(value).trim();
};

const getNullableCellValue = (row: ExcelJS.Row, col: number): string | "null" => {
  const cell = row.getCell(col);
  const value = cell.value;

  if (!value || value === null || String(value).trim() === "") {
    return "null";
  }
  return String(value).trim();
};
