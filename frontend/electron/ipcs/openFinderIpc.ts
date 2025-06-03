import { OPEN_FINDER } from "../../src/constants/ipc";
import { shell, ipcMain } from "electron";

export const openFinderIpc = () => {
  ipcMain.on(OPEN_FINDER, (_event, folderPath) => {
    shell.openPath(folderPath).catch((err) => {
      console.error("폴더 열기 실패:", err);
    });
  });
};
