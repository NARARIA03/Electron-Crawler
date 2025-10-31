import { ipcMain } from "electron";
import OpenGoKrController, { type OpenGoKrTask } from "../controller/OpenGoKr.controller";
import { PREFIX } from "../constants";

export const openGoKrIpc = () => {
  /** READ */
  ipcMain.handle(`${PREFIX}:getAllTasks`, () => {
    return OpenGoKrController.getAllTasks();
  });

  /** CREATE */
  ipcMain.handle(`${PREFIX}:addTask`, (_, task: OpenGoKrTask) => {
    return OpenGoKrController.addTask(task);
  });

  /** UPDATE */
  ipcMain.handle(`${PREFIX}:updateTask`, (_, id: string, newValue: Partial<OpenGoKrTask>) => {
    return OpenGoKrController.updateTask(id, newValue);
  });

  ipcMain.handle(`${PREFIX}:updateTaskAll`, (_, newValue: Partial<OpenGoKrTask>) => {
    return OpenGoKrController.updateTaskAll(newValue);
  });

  /** DELETE */
  ipcMain.handle(`${PREFIX}:cancelTask`, (_, id: string) => {
    return OpenGoKrController.cancelTask(id);
  });

  ipcMain.handle(`${PREFIX}:runTask`, (_, id: string) => {
    return OpenGoKrController.runTask(id);
  });

  ipcMain.handle(`${PREFIX}:scheduleTask`, (_, id: string) => {
    return OpenGoKrController.scheduleTask(id);
  });
};
