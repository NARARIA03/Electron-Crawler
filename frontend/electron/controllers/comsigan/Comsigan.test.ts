import { test, vi } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { afterEach, beforeEach } from "node:test";
import type { ComsiganTask } from "./Comsigan.controller";
import ComsiganController from "./Comsigan.controller";

const DIR_NAME = "test-output";

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  shell: {
    openPath: vi.fn((path: string) => console.log("openPath 호출", path)),
  },
  app: {
    isPackaged: false,
  },
}));

beforeEach(() => {
  const testDir = path.join(process.cwd(), DIR_NAME);
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
  fs.mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  const testDir = path.join(process.cwd(), DIR_NAME);
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
});

test("Comsigan 개발용 테스트", async () => {
  const id = Date.now().toString();
  const baseDir = path.join(process.cwd(), DIR_NAME);

  const task: ComsiganTask = {
    id,
    data: [
      { schoolName: "휘봉고", region: "서울", teacherName: "이수" },
      { schoolName: "휘봉고", region: "서울", teacherName: "최정" },
    ],
    excelName: "QUERY컴시간테스트.xlsx",
    baseDir,
    status: "예약완료",
    debug: true,
  };

  ComsiganController.addTask(task);
  await ComsiganController.runTask(task.id);
  ComsiganController.cancelTask(task.id);
});
