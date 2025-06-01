import { SELECT_DIRECTORY } from "../../src/constants/ipc";
import { dialog, ipcMain } from "electron";

export const downloadDirIpc = () => {
  ipcMain.handle(SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "폴더 선택",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
};
