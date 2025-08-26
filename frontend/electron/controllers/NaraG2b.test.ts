import { test, vi } from "vitest";
import NaraG2bController, { NaraG2bTask } from "./NaraG2b.controller";

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  shell: {
    openPath: vi.fn((path: string) => console.log("openPath 호출", path)),
  },
}));

test("NaraG2B 검색 결과가 없는 경우", async () => {
  const id = Date.now().toString();

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "소모  dsfskjdflks",
        startDate: "2024-08-25",
        endDate: "2025-08-24",
        organization: "서울특별시교육청 경기기계공업고등학교",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
  NaraG2bController.cancelTask(task.id);
});

test("NaraG2B 수요 기관이 없는 경우", async () => {
  const id = Date.now().toString();

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "소모",
        startDate: "2024-08-25",
        endDate: "2025-08-24",
        organization: "없는 기관",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
  NaraG2bController.cancelTask(task.id);
});

test("NaraG2b 검색어 없는 케이스 / 여러 수요 기관 검색되는 경우 테스트", async () => {
  const id = Date.now().toString();

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "",
        startDate: "2025-08-20",
        endDate: "2025-08-24",
        organization: "가림고등학교",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
  NaraG2bController.cancelTask(task.id);
});

test("NaraG2B 즉시 실행 테스트", async () => {
  const id = Date.now().toString();

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "소모",
        startDate: "2025-01-20",
        endDate: "2025-08-24",
        organization: "서울특별시교육청 경기기계공업고등학교",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
  NaraG2bController.cancelTask(task.id);
});
