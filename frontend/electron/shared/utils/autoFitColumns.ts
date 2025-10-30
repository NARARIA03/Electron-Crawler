import type { Worksheet } from "exceljs";

/**
 * @description xlsx 셀의 width를 맞추는 함수
 */
export const autoFitColumns = (ws: Worksheet) => {
  const colWidths: number[] = [];
  ws.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const value = cell.value ? String(cell.value) : "";
      let cellWidth = 0;

      for (const char of value) {
        cellWidth += /[\u3131-\uD79D]/.test(char) ? 2 : 1;
      }
      colWidths[colNumber - 1] = Math.max(colWidths[colNumber - 1] || 10, cellWidth + 2);
    });
    ws.columns = colWidths.map((width) => ({ width }));
  });
};
