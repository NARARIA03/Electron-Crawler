import { ipcMain } from "electron";
import ComsiganController, { type ComsiganTask } from "../controller/Comsigan.controller";
import { PREFIX } from "../constants";

export const comsiganIpc = () => {
  /** READ */
  ipcMain.handle(`${PREFIX}:getAllTasks`, () => {
    return ComsiganController.getAllTasks();
  });

  /** CREATE */
  ipcMain.handle(`${PREFIX}:addTask`, (_, task: ComsiganTask) => {
    return ComsiganController.addTask(task);
  });

  /** UPDATE */
  ipcMain.handle(`${PREFIX}:updateTask`, (_, id: string, newValue: Partial<ComsiganTask>) => {
    return ComsiganController.updateTask(id, newValue);
  });

  ipcMain.handle(`${PREFIX}:updateTaskAll`, (_, newValue: Partial<ComsiganTask>) => {
    return ComsiganController.updateTaskAll(newValue);
  });

  /** DELETE */
  ipcMain.handle(`${PREFIX}:cancelTask`, (_, id: string) => {
    return ComsiganController.cancelTask(id);
  });

  ipcMain.handle(`${PREFIX}:runTask`, (_, id: string) => {
    return ComsiganController.runTask(id);
  });

  ipcMain.handle(`${PREFIX}:scheduleTask`, (_, id: string) => {
    return ComsiganController.scheduleTask(id);
  });
};
