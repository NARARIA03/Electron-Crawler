import { app, BrowserWindow, shell } from "electron";
import { type ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type Task = {
  id: string;
  data: unknown[] | null;
  excelName: string | null;
  baseDir: string | null;
  scheduledTime?: Date;
  status: "대기중" | "예약완료" | "작업중" | "작업완료" | "작업실패" | "취소됨";
  process?: ChildProcess;
  debug: string | null;
};

class OpenGoKrService {
  private static dirName = path.dirname(fileURLToPath(import.meta.url));
  private static tasks = new Map<string, Task>();
  private static scheduledTasks = new Map<string, NodeJS.Timeout>();

  /** READ */
  public static getAllTasks() {
    return [...this.tasks.values()].map(({ process: _, ...rest }) => rest);
  }

  /** CREATE */
  public static addTask(task: Task) {
    this.tasks.set(task.id, task);
    this.notifyUpdate();
  }

  /** UPDATE */
  public static updateTask = (id: string, newValue: Partial<Task>) => {
    const task = this.tasks.get(id);
    if (task) {
      const newTask = { ...task, ...newValue };
      this.tasks.set(id, newTask);
      this.notifyUpdate();
    }
  };

  public static updateTaskAll = (newValue: Partial<Task>) => {
    this.tasks.forEach((task, id) => {
      const updatedTask = { ...task, ...newValue };
      this.tasks.set(id, updatedTask);
    });
    this.notifyUpdate();
  };

  /** DELETE */
  public static cancelTask(id: string) {
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

    // 실행 중 작업 -> 실행 종료, 태스크 리스트에는 유지, 취소됨 상태로 변경 -> 어차피 error에서 캐치되면서 실패로 바뀜, 이후 UI 반영
    if (task.process) {
      task.process.kill();
      this.updateTask(id, { status: "취소됨", process: undefined });
      return true;
    }

    // 나머지 작업 -> 태스크 리스트에서 삭제, 이후 UI 반영
    this.tasks.delete(id);
    this.notifyUpdate();
    return true;
  }

  public static runTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) throw new Error("id에 해당하는 태스크가 존재하지 않습니다");

    this.executeTask(id);
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

    return id;
  }

  private static executeTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) return;

    this.updateTask(id, { status: "작업중" });

    const exeName = process.platform === "win32" ? "script.exe" : "script";
    const exePath = app.isPackaged
      ? path.join(process.resourcesPath, "resources", exeName)
      : path.join(this.dirName, "..", "resources", exeName);

    if (!task.baseDir) throw new Error("기본 저장 경로가 설정되지 않았습니다");
    if (!task.excelName || !task.data) throw new Error("엑셀을 정상적으로 인식하지 못했습니다");

    const child = spawn(exePath, [
      "--baseDir",
      task.baseDir,
      "--excelName",
      task.excelName,
      "--data",
      JSON.stringify(task.data),
      "--debug",
      JSON.stringify(task.debug ?? false),
    ]);

    this.updateTask(id, { process: child });

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf-8");

      const successDir = text.match(/DIRECTORY:(.+)/);
      const failedDir = text.match(/FAILDIRECTORY:(.+)/);

      if (successDir && successDir[1]) {
        const dir = successDir[1].trim();
        shell.openPath(dir);
      } else if (failedDir && failedDir[1]) {
        const dir = failedDir[1].trim();
        console.log(`failedDir: ${dir}`);
        shell.openPath(dir);
      }
    });

    child.on("close", (code: number) => {
      this.updateTask(id, { status: code === 0 ? "작업완료" : "작업실패", process: undefined });
    });

    child.on("error", () => {
      this.updateTask(id, { status: "작업실패", process: undefined });
    });
  }

  private static notifyUpdate() {
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((window) => {
      window.webContents.send("openGoKr:notifyUpdate", this.getAllTasks());
    });
  }

  /** DEBUG */
  public static getDebugInfo() {
    return {
      tasks: Array.from(this.tasks.entries()).map(([id, task]) => ({
        id,
        status: task.status,
        excelName: task.excelName,
        dataLength: task.data?.length ?? 0,
        hasProcess: !!task.process,
        scheduledTime: task.scheduledTime?.toISOString(),
        baseDir: task.baseDir,
        debug: task.debug,
      })),
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
      totalTasks: this.tasks.size,
      totalScheduled: this.scheduledTasks.size,
    };
  }
}

export default OpenGoKrService;
