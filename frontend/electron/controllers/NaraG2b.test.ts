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
        query: "소모dsfskjdflks",
        startDate: "2024-08-25",
        endDate: "2025-08-24",
        organization: "경기기계공업고등학교",
        location: "서울특별시교육청",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
});

test("NaraG2B 수요 기관이 없는 경우", async () => {
  const id = Date.now().toString();

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "소모dsfskjdflks",
        startDate: "2024-08-25",
        endDate: "2025-08-24",
        organization: "경기기계공업123고등학교",
        location: "서울특별시교123육청",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
});

test("NaraG2B 즉시 실행 테스트", async () => {
  const id = Date.now().toString();

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "소모",
        startDate: "2024-08-25",
        endDate: "2025-08-24",
        organization: "경기기계공업고등학교",
        location: "서울특별시교육청",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
  };

  NaraG2bController.addTask(task);
  await NaraG2bController.runTask(task.id);
});
