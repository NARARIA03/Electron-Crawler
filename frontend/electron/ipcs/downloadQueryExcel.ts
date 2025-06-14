import { app, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";

export const downloadQueryExcel = () => {
  ipcMain.handle("download-excel", async () => {
    const downloadsDir = app.getPath("downloads");
    const dest = path.join(downloadsDir, "query.xlsx");

    const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
    const src = path.join(basePath, "public", "excel", "query.xlsx");
    await fs.promises.copyFile(src, dest);
    return dest;
  });
};
