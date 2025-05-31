import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "node:child_process";

const RUN_PYTHON_PROCESS = "run-python";
const PYTHON_RESULT_PROCESS = "python-result";
const PROCESS_NAME = {
  win: "script.exe",
  mac: "script",
};

// const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      devTools: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();

  ipcMain.on(RUN_PYTHON_PROCESS, (event, args: { type: string; data: any[] }) => {
    console.log("▶︎ app.isPackaged:", app.isPackaged);
    // 실행 파일 이름
    const exeName = process.platform === "win32" ? PROCESS_NAME.win : PROCESS_NAME.mac;
    // 개발 모드: frontend/resources/script
    // 빌드 모드: Contents/Resources/resources/script
    const exePath = app.isPackaged
      ? path.join(process.resourcesPath, "resources", exeName)
      : path.join(__dirname, "..", "resources", exeName);

    console.log("▶︎ [run-python] exePath:", exePath);

    const child = spawn(exePath, ["--type", args.type, "--data", JSON.stringify(args.data)]);

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
});
