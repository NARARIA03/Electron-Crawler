import { PROCESS_NAME, PYTHON } from "../../src/constants/ipc";
import { app, ipcMain } from "electron";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pythonIpc = () => {
  ipcMain.on(
    PYTHON.run,
    (event, args: { type: string; data: any[]; downloadDir: string | null; excelName: string | null }) => {
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
    }
  );
};
