import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { downloadDirIpc, downloadQueryExcel, openFinderIpc, preventPowerSave } from "./ipcs";
import { openGoKrIpc } from "./ipcs/openGoKrIpc";
import OpenGoKrService from "./services/OpenGoKrService";

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

app.on("before-quit", () => {
  preventPowerSave.stop();
});

app.whenReady().then(() => {
  createWindow();
  downloadDirIpc();
  openGoKrIpc();
  openFinderIpc();
  downloadQueryExcel();
  preventPowerSave.start();

  // 개발 환경에서만 디버깅 활성화
  if (!app.isPackaged) {
    console.log("🔍 Development mode: OpenGoKr 디버깅이 활성화되었습니다.");
    setInterval(() => {
      const debugInfo = OpenGoKrService.getDebugInfo();
      console.log("=== OpenGoKr Debug Info ===");
      console.log(`📊 Total Tasks: ${debugInfo.totalTasks}, Scheduled: ${debugInfo.totalScheduled}`);
      if (debugInfo.tasks.length > 0) {
        console.log("📋 Tasks:");
        debugInfo.tasks.forEach((task) => {
          console.log(
            `  - ${task.id}: ${task.status} (${task.dataLength}행)${task.hasProcess ? " [실행중]" : ""}${
              task.scheduledTime ? ` [예약: ${task.scheduledTime}]` : ""
            }`
          );
          console.log(`    📁 baseDir: ${task.baseDir || "미설정"}`);
          console.log(`    🐛 debug: ${task.debug || "false"}`);
        });
      }
      if (debugInfo.scheduledTasks.length > 0) {
        console.log(`⏰ Scheduled Tasks: ${debugInfo.scheduledTasks.join(", ")}`);
      }
      console.log("===========================\n");
    }, 5000);
  }
});
