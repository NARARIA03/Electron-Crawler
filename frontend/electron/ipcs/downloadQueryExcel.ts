import { app, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const downloadQueryExcel = () => {
  ipcMain.handle("download-excel", async () => {
    const downloadsDir = app.getPath("downloads");
    const dest = path.join(downloadsDir, "query.xlsx");

    const src = app.isPackaged
      ? path.join(process.resourcesPath, "excel", "query.xlsx") // 배포 후
      : path.join(__dirname, "..", "excel", "query.xlsx"); // 개발 중

    console.log(src, dest);

    await fs.promises.copyFile(src, dest);
    return dest;
  });
};
