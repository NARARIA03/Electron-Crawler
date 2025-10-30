import path from "node:path";
import { test } from "vitest";

test("createTableView 테스트", async () => {
  const XlsxService = (await import("../service/Xlsx.service")).default;

  const existingExcelPath = path.join(process.cwd(), "test-output/excel_database/컴시간테스트");
  const excelName = "컴시간테스트.xlsx";

  const xlsxService = new XlsxService(existingExcelPath, excelName);

  await xlsxService.createTableView();
  await xlsxService.save();
});
