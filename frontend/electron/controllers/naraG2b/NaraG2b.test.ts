import { beforeEach, afterEach, test, vi, expect } from "vitest";
import ExcelJS from "exceljs";
import NaraG2bController, { NaraG2bTask } from "./NaraG2b.controller";
import path from "node:path";
import fs from "node:fs";

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  shell: {
    openPath: vi.fn((path: string) => console.log("openPath 호출", path)),
  },
}));

beforeEach(() => {
  const testDir = path.join(process.cwd(), "test-output");
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
  fs.mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  const testDir = path.join(process.cwd(), "test-output");
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
});

test("NaraG2B 검색 결과가 없는 경우", async () => {
  const id = Date.now().toString();
  const baseDir = path.join(process.cwd(), "test-output");

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "소모  dsfskjdflks",
        startDate: "2024-08-25",
        endDate: "2025-08-24",
        organization: "서울특별시교육청 경기기계공업고등학교",
        region: "서울",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir,
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
  NaraG2bController.cancelTask(task.id);

  await validateErrorCase(baseDir, "검색 결과 없음", task.data?.[0].query, task.data?.[0].organization);
});

test("NaraG2B 수요 기관이 없는 경우", async () => {
  const id = Date.now().toString();
  const baseDir = path.join(process.cwd(), "test-output");

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "소모",
        startDate: "2024-08-25",
        endDate: "2025-08-24",
        organization: "없는 기관",
        region: "서울",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir,
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
  NaraG2bController.cancelTask(task.id);

  await validateErrorCase(baseDir, "수요기관 존재하지 않음", task.data?.[0].query, task.data?.[0].organization);
});

test("NaraG2b 즉시 실행 / 검색어 없는 케이스 / 여러 수요 기관 검색되는 경우 테스트", async () => {
  const id = Date.now().toString();
  const baseDir = path.join(process.cwd(), "test-output");

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "",
        startDate: "2025-08-20",
        endDate: "2025-08-24",
        organization: "가림고등학교",
        region: "서울",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir,
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
  NaraG2bController.cancelTask(task.id);

  await validateSuccessCase(baseDir, task.data?.[0].query, task.data?.[0].organization);
});

const validateErrorCase = async (baseDir: string, message: string, query?: string, organization?: string) => {
  const excelPath = path.join(baseDir, "excel_database", "테스트", "테스트.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(excelPath);
  const ws = wb.getWorksheet("Sheet1");

  expect(ws).toBeDefined();

  const headerRow = ws?.getRow(1);
  expect(headerRow?.getCell(1).value).toBe("검색어");
  expect(headerRow?.getCell(2).value).toBe("기관명");
  expect(headerRow?.getCell(3).value).toBe("정보제목");
  expect(headerRow?.getCell(4).value).toBe("파일링크");

  const dataRow = ws?.getRow(2);
  expect(dataRow?.getCell(1).value).toBe(query);
  expect(dataRow?.getCell(2).value).toBe(organization);
  expect(dataRow?.getCell(3).value).toBe("");
  expect(dataRow?.getCell(4).value).toBe(message);

  const errorCell = dataRow?.getCell(4);
  expect(errorCell?.font?.color?.argb).toBe("FFFF0000");
};

const validateSuccessCase = async (baseDir: string, query?: string, organization?: string) => {
  const excelPath = path.join(baseDir, "excel_database", "테스트", "테스트.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(excelPath);
  const ws = wb.getWorksheet("Sheet1");

  expect(ws).toBeDefined();

  const headerRow = ws?.getRow(1);
  expect(headerRow?.getCell(1).value).toBe("검색어");
  expect(headerRow?.getCell(2).value).toBe("기관명");
  expect(headerRow?.getCell(3).value).toBe("정보제목");
  expect(headerRow?.getCell(4).value).toBe("파일링크");

  const dataRow = ws?.getRow(2);
  expect(dataRow?.getCell(1).value).toBe(query);
  expect(dataRow?.getCell(2).value).toBe(organization);
  expect(dataRow?.getCell(3).value).toBeDefined();
  expect(dataRow?.getCell(4).value).toBeDefined();

  const linkCell = dataRow?.getCell(4);
  expect(linkCell?.font?.color?.theme).toBe(10);
  expect(linkCell?.font?.underline).toBe(true);
};
