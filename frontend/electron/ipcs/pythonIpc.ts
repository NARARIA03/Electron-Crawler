import { PROCESS_NAME, PYTHON } from "../../src/constants/ipc";
import { app, ipcMain, IpcMainEvent } from "electron";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

type IPCArgs = {
  type: string;
  data: any[];
  downloadDir: string | null;
  excelName: string | null;
  scheduledTime?: string;
};

type RunPythonArgs = Omit<IPCArgs, "scheduledTime">;

type Task = Omit<IPCArgs, "scheduledTime"> & {
  event: IpcMainEvent;
  scheduledTime: Date;
};

let task: Task | undefined;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

setInterval(() => {
  console.log(`task: ${task}`);
  const now = new Date();

  if (task && task.scheduledTime <= now) {
    console.log("예약 실행");
    runPythonProcess(task.event, task);
  }
}, 1000);

export const pythonIpc = () => {
  ipcMain.on(PYTHON.run, (event, args: IPCArgs) => {
    const scheduled = args.scheduledTime ? new Date(args.scheduledTime) : null;

    if (scheduled && scheduled > new Date()) {
      task = {
        type: args.type,
        data: args.data,
        downloadDir: args.downloadDir,
        excelName: args.excelName,
        scheduledTime: scheduled,
        event,
      };
      console.log("예약 등록됨:", task);
    } else {
      runPythonProcess(event, args);
    }
  });
};

const runPythonProcess = (event: IpcMainEvent, args: RunPythonArgs) => {
  task = undefined;

  const exeName = process.platform === "win32" ? PROCESS_NAME.win : PROCESS_NAME.mac;
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, "resources", exeName)
    : path.join(__dirname, "..", "resources", exeName);

  const downloadDir = (() => {
    if (args.downloadDir) return args.downloadDir;
    if (app.isPackaged) return path.join(process.resourcesPath, "downloads");
    return path.join(__dirname, "downloads");
  })();

  const child = spawn(exePath, [
    "--type",
    args.type,
    "--downloadDir",
    downloadDir,
    "--excelName",
    args.excelName ?? "database.xlsx",
    "--data",
    JSON.stringify(args.data),
  ]);

  child.stdout.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    event.reply(PYTHON.stdout, text);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    event.reply(PYTHON.stderr, text);
  });

  child.on("close", (code: number) => {
    event.reply(PYTHON.result, { exitCode: code });
  });
};
