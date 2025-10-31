import { BrowserWindow, shell } from "electron";
import path from "node:path";
import ComsiganService, { type ComsiganCrawlData } from "../service/Comsigan.service";
import type { TStatus } from "../../shared/types";

export type ComsiganTask = {
  id: string;
  data: ComsiganCrawlData[] | null;
  excelName: string | null;
  baseDir: string | null;
  scheduledTime?: Date;
  status: TStatus;
  service?: ComsiganService;
  debug: boolean;
};

class ComsiganController {
  private static tasks = new Map<string, ComsiganTask>();
  private static scheduledTasks = new Map<string, NodeJS.Timeout>();

  /** READ */
  public static getAllTasks() {
    return [...this.tasks.values()].map(({ service: _, ...rest }) => rest);
  }

  /** CREATE */
  public static addTask(task: ComsiganTask) {
    this.tasks.set(task.id, task);
    this.notifyUpdate();
  }

  /** UPDATE */
  public static updateTask(id: string, newValue: Partial<ComsiganTask>) {
    const task = this.tasks.get(id);
    if (task) {
      const newTask = { ...task, ...newValue };
      this.tasks.set(id, newTask);
      this.notifyUpdate();
    }
  }

  public static updateTaskAll(newValue: Partial<ComsiganTask>) {
    this.tasks.forEach((task, id) => {
      const newTask = { ...task, ...newValue };
      this.tasks.set(id, newTask);
    });
    this.notifyUpdate();
  }

  public static cancelTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) return false;

    // 예약 작업
    const timer = this.scheduledTasks.get(id);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTasks.delete(id);
      this.tasks.delete(id);
      this.notifyUpdate();
      return true;
    }

    // 실행 중 작업
    if (task.service) {
      task.service.close();
      this.updateTask(id, { status: "취소됨", service: undefined });
      return true;
    }

    // 나머지 작업
    this.tasks.delete(id);
    this.notifyUpdate();
    return true;
  }

  public static async runTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) throw new Error("id에 해당하는 태스크가 존재하지 않습니다");

    const timer = this.scheduledTasks.get(id);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTasks.delete(id);
    }

    await this.executeTask(id);
    return id;
  }

  public static scheduleTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) throw new Error("id에 해당하는 태스크가 존재하지 않습니다");

    const scheduledTime = task.scheduledTime;
    if (!scheduledTime) throw new Error("태스크에 예약시간 값이 없습니다");

    const delay = scheduledTime.getTime() - Date.now();

    const timer = setTimeout(() => {
      this.executeTask(id);
      this.scheduledTasks.delete(id);
    }, delay);

    this.scheduledTasks.set(id, timer);
    this.updateTask(id, { status: "예약완료" });

    return id;
  }

  private static async executeTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) return;
    if (!task.baseDir) throw new Error("기본 저장 경로가 설정되지 않았습니다");
    if (!task.excelName || !task.data) throw new Error("엑셀을 정상적으로 인식하지 못했습니다");

    const pathName = task.excelName.split(".")[0].toLowerCase().replaceAll("query", "") || "default-result-comsigan";
    const outputDir = path.join(task.baseDir, "excel_database", pathName);

    try {
      this.updateTask(id, { status: "작업중" });
      const service = new ComsiganService({
        data: task.data,
        excelName: task.excelName,
        baseDir: task.baseDir,
        debug: task.debug,
      });
      this.updateTask(id, { service });
      console.log(this.tasks.get(id));
      await service.crawl();
      this.updateTask(id, { status: "작업완료", service: undefined });
      shell.openPath(outputDir);
    } catch (error) {
      console.error(`Comsigan 크롤링 오류: ${error}`);
      this.updateTask(id, { status: "작업실패", service: undefined });
      shell.openPath(outputDir);
    }
  }

  private static notifyUpdate() {
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((window) => {
      window.webContents.send("comsigan:notifyUpdate", this.getAllTasks());
    });
  }
}

export default ComsiganController;
