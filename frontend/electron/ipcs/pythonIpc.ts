import { PROCESS_NAME, PYTHON_RESULT_PROCESS, RUN_PYTHON_PROCESS } from "../../src/constants/ipc";
import { app, ipcMain } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";

export const pythonIpc = () => {
  ipcMain.on(RUN_PYTHON_PROCESS, (event, args: { type: string; data: any[]; downloadDir: string | null }) => {
    console.log("▶︎ app.isPackaged:", app.isPackaged);
    // 실행 파일 이름
    const exeName = process.platform === "win32" ? PROCESS_NAME.win : PROCESS_NAME.mac;
    // 개발 모드: frontend/resources/script
    // 빌드 모드: Contents/Resources/resources/script
    const exePath = app.isPackaged
      ? path.join(process.resourcesPath, "resources", exeName)
      : path.join(__dirname, "..", "resources", exeName);

    // 파일 다운로드 디렉토리 연결
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
      "--data",
      JSON.stringify(args.data),
    ]);

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutData += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString();
      console.error(`[python stderr] ${chunk.toString()}`);
    });
    child.on("close", (code: number) => {
      event.reply(PYTHON_RESULT_PROCESS, {
        exitCode: code,
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
      });
    });
  });
};
