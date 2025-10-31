import { BrowserWindow, shell } from "electron";
import path from "node:path";
import NaraG2bService, { type NaraG2bCrawlData } from "../service/NaraG2b.service";
import type { TStatus } from "../../shared/types";
import { PREFIX } from "../constants";

export type NaraG2bTask = {
  id: string;
  data: NaraG2bCrawlData[] | null;
  excelName: string | null;
  baseDir: string | null;
  scheduledTime?: Date;
  status: TStatus;
  service?: NaraG2bService;
  debug: boolean;
};

class NaraG2bController {
  private static tasks = new Map<string, NaraG2bTask>();
  private static scheduledTasks = new Map<string, NodeJS.Timeout>();

  /** READ */
  public static getAllTasks() {
    return [...this.tasks.values()].map(({ service: _, ...rest }) => rest);
  }

  /** CREATE */
  public static addTask(task: NaraG2bTask) {
    this.tasks.set(task.id, task);
    this.notifyUpdate();
  }

  /** UPDATE */
  public static updateTask = (id: string, newValue: Partial<NaraG2bTask>) => {
    const task = this.tasks.get(id);
    if (task) {
      const newTask = { ...task, ...newValue };
      this.tasks.set(id, newTask);
      this.notifyUpdate();
    }
  };

  public static updateTaskAll = (newValue: Partial<NaraG2bTask>) => {
    this.tasks.forEach((task, id) => {
      const updatedTask = { ...task, ...newValue };
      this.tasks.set(id, updatedTask);
    });
    this.notifyUpdate();
  };

  /** DELETE */
  public static async cancelTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) return false;

    const timer = this.scheduledTasks.get(id);

    // 예약 작업 -> 예약 취소, 태스크 리스트에서도 제거, 이후 UI 반영
    if (timer) {
      clearTimeout(timer);
      this.scheduledTasks.delete(id);
      this.tasks.delete(id);
      this.notifyUpdate();
      return true;
    }

    // 실행 중 작업 -> 실행 종료, 태스크 리스트에는 유지, 취소됨 상태로 변경
    if (task.service) {
      await task.service.close();
      this.updateTask(id, { status: "취소됨", service: undefined });
      return true;
    }

    // 나머지 작업 -> 태스크 리스트에서 삭제, 이후 UI 반영
    this.tasks.delete(id);
    this.notifyUpdate();
    return true;
  }

  public static async runTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) throw new Error("id에 해당하는 태스크가 존재하지 않습니다");
    // 기존에 예약되어 있던 작업이 있다면 취소
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

    const pathName = task.excelName.split(".")[0].toLowerCase().replaceAll("query", "") || "result";
    const outputDir = path.join(task.baseDir, "excel_database", pathName);

    try {
      this.updateTask(id, { status: "작업중" });

      const service = new NaraG2bService({
        data: task.data,
        excelName: task.excelName,
        baseDir: task.baseDir,
        debug: task.debug,
      });
      this.updateTask(id, { service });

      console.log(this.tasks.get(id));

      await service.crawl();
      this.updateTask(id, { status: "작업완료", service: undefined });

      // 작업 완료 후 디렉토리 열기
      shell.openPath(outputDir);
    } catch (error) {
      console.error(`NaraG2B 크롤링 오류: ${error}`);
      this.updateTask(id, { status: "작업실패", service: undefined });

      // 실패한 경우에도 작업 디렉토리 열기
      shell.openPath(outputDir);
    }
  }

  private static notifyUpdate() {
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((window) => {
      window.webContents.send(`${PREFIX}:notifyUpdate`, this.getAllTasks());
    });
  }
}

export default NaraG2bController;
