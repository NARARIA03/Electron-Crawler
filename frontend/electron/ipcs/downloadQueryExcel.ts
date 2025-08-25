import { app, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type TExcelName = "정보공개포털query.xlsx" | "나라장터query.xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const downloadQueryExcel = () => {
  ipcMain.handle("download-excel", async (_, excelName: TExcelName) => {
    const downloadDir = app.getPath("downloads");
    const dest = path.join(downloadDir, excelName);

    const src = app.isPackaged
      ? path.join(process.resourcesPath, "excel", excelName) // 배포 후
      : path.join(__dirname, "..", "excel", excelName); // 개발 중

    console.log(src, dest);

    await fs.promises.copyFile(src, dest);
    await shell.openPath(downloadDir);
    return dest;
  });
};
