import { app as n, BrowserWindow as P, ipcMain as w } from "electron";
import { fileURLToPath as S } from "node:url";
import e from "node:path";
import { spawn as T } from "node:child_process";
const f = "run-python", h = "python-result", m = {
  win: "script.exe",
  mac: "script"
}, i = e.dirname(S(import.meta.url));
process.env.APP_ROOT = e.join(i, "..");
const r = process.env.VITE_DEV_SERVER_URL, j = e.join(process.env.APP_ROOT, "dist-electron"), R = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = r ? e.join(process.env.APP_ROOT, "public") : R;
let o;
function _() {
  o = new P({
    icon: e.join(process.env.VITE_PUBLIC, "vite.svg"),
    webPreferences: {
      preload: e.join(i, "preload.mjs"),
      devTools: !0
    }
  }), o.webContents.on("did-finish-load", () => {
    o == null || o.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), r ? o.loadURL(r) : o.loadFile(e.join(R, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), o = null);
});
n.on("activate", () => {
  P.getAllWindows().length === 0 && _();
});
n.whenReady().then(() => {
  _(), w.on(f, (E, a) => {
    console.log("▶︎ app.isPackaged:", n.isPackaged);
    const c = process.platform === "win32" ? m.win : m.mac, p = n.isPackaged ? e.join(process.resourcesPath, "resources", c) : e.join(i, "..", "resources", c);
    console.log("▶︎ [run-python] exePath:", p);
    const s = T(p, ["--type", a.type, "--data", JSON.stringify(a.data)]);
    let d = "", l = "";
    s.stdout.on("data", (t) => {
      d += t.toString();
    }), s.stderr.on("data", (t) => {
      l += t.toString(), console.error(`[python stderr] ${t.toString()}`);
    }), s.on("close", (t) => {
      E.reply(h, {
        exitCode: t,
        stdout: d.trim(),
        stderr: l.trim()
      });
    });
  });
});
export {
  j as MAIN_DIST,
  R as RENDERER_DIST,
  r as VITE_DEV_SERVER_URL
};
