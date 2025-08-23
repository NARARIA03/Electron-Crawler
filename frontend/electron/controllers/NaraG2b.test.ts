import { expect, test, vi } from "vitest";
import NaraG2bController, { NaraG2bTask } from "./NaraG2b.controller";

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  shell: {
    openPath: vi.fn((path: string) => console.log("openPath 호출", path)),
  },
}));

test("NaraG2B 예약 테스트", () => {
  const id = Date.now().toString();
  const scheduledTime = new Date(new Date().getTime() + 5 * 1000); // 5초 후

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "신발장",
        startDate: "2024-11-23",
        endDate: "2025-05-22",
        organization: "개운중학교",
        location: "서울특별시교육청",
      },
    ],
    excelName: "테스트.xlsx",
    baseDir: "/Users/hyunseong/Desktop",
    status: "예약완료",
    debug: true,
    scheduledTime,
  };

  NaraG2bController.addTask(task);

  expect(NaraG2bController.getAllTasks()[0]).toStrictEqual(task);
});

test("NaraG2B 즉시 실행 테스트", async () => {
  const id = Date.now().toString();

  const task: NaraG2bTask = {
    id,
    data: [
      {
        query: "신발장",
        startDate: "2024-11-23",
        endDate: "2025-05-22",
        organization: "개운중학교",
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
