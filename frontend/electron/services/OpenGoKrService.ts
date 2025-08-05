import { app, BrowserWindow, shell } from "electron";
import { type ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Task = {
  id: string;
  data: unknown[];
  excelName: string;
  baseDir: string;
  scheduledTime?: Date;
  status: "대기중" | "예약완료" | "작업중" | "작업완료" | "작업실패";
  process?: ChildProcess;
  debug: string;
};

export type RunTaskArgs = {
  id: string;
  data: unknown[];
  baseDir: string | null;
  excelName: string | null;
  debug: string | null;
};

export type ScheduleTaskArgs = {
  id: string;
  data: unknown[];
  baseDir: string | null;
  excelName: string | null;
  debug: string | null;
  scheduledTime: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tasks = new Map<string, Task>();
const scheduledTasks = new Map<string, NodeJS.Timeout>();

const OpenGoKrService = {
  getAllTasks: () => {
    return [...tasks.values()].map(({ process: _, ...taskWithoutProcess }) => taskWithoutProcess);
  },

  getTask: (id: string) => {
    const task = tasks.get(id);
    if (!task) return undefined;

    const { process: _, ...taskWithoutProcess } = task;
    return taskWithoutProcess;
  },

  runTask: (args: RunTaskArgs) => {
    const task: Task = {
      id: args.id,
      data: args.data,
      excelName: args.excelName ?? "database.xlsx",
      baseDir: args.baseDir ?? "/database",
      status: "대기중",
      debug: args.debug ?? "false",
    };
    tasks.set(args.id, task);
    executeTask(args.id);

    return args.id;
  },

  scheduleTask: (args: ScheduleTaskArgs) => {
    const scheduledTime = new Date(args.scheduledTime);
    const delay = scheduledTime.getTime() - Date.now();

    const task: Task = {
      id: args.id,
      data: args.data,
      excelName: args.excelName ?? "database.xlsx",
      baseDir: args.baseDir ?? "/database",
      status: "예약완료",
      debug: args.debug ?? "false",
    };

    tasks.set(args.id, task);

    const timer = setTimeout(() => {
      executeTask(args.id);
      scheduledTasks.delete(args.id);
    }, delay);

    scheduledTasks.set(args.id, timer);

    return args.id;
  },

  cancelTask: (id: string) => {
    const task = tasks.get(id);
    if (!task) return false;

    const timer = scheduledTasks.get(id);
    if (timer) {
      clearTimeout(timer);
      scheduledTasks.delete(id);
      return true;
    }

    if (task.process) {
      task.process.kill();
      setTasks(id, { status: "작업실패", process: undefined });
      return true;
    }

    return false;
  },
};

export default OpenGoKrService;

const executeTask = (id: string) => {
  const task = tasks.get(id);
  if (!task) return;

  setTasks(id, { status: "작업중" });

  const exeName = process.platform === "win32" ? "script.exe" : "script";
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, "resources", exeName)
    : path.join(__dirname, "..", "resources", exeName);

  const child = spawn(exePath, [
    "--baseDir",
    task.baseDir,
    "--excelName",
    task.excelName,
    "--data",
    JSON.stringify(task.data),
    "--debug",
    JSON.stringify(task.debug),
  ]);

  setTasks(id, { process: child });

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
    setTasks(id, { status: code === 0 ? "작업완료" : "작업실패", process: undefined });
  });

  child.on("error", () => {
    setTasks(id, { status: "작업실패", process: undefined });
  });
};

const setTasks = (id: string, newValue: Partial<Task>) => {
  const task = tasks.get(id);
  if (task) {
    const newTask = { ...task, ...newValue };
    tasks.set(id, newTask);

    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((window) => {
      window.webContents.send("openGoKr:updateStatus", { id, status: newTask.status });
    });
  }
};
