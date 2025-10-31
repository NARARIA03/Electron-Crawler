import { ipcMain } from "electron";
import NaraG2bController, { type NaraG2bTask } from "../controller/NaraG2b.controller";
import { PREFIX } from "../constants";

export const naraG2bIpc = () => {
  /** READ */
  ipcMain.handle(`${PREFIX}:getAllTasks`, () => {
    return NaraG2bController.getAllTasks();
  });

  /** CREATE */
  ipcMain.handle(`${PREFIX}:addTask`, (_, task: NaraG2bTask) => {
    return NaraG2bController.addTask(task);
  });

  /** UPDATE */
  ipcMain.handle(`${PREFIX}:updateTask`, (_, id: string, newValue: Partial<NaraG2bTask>) => {
    return NaraG2bController.updateTask(id, newValue);
  });

  ipcMain.handle(`${PREFIX}:updateTaskAll`, (_, newValue: Partial<NaraG2bTask>) => {
    return NaraG2bController.updateTaskAll(newValue);
  });

  /** DELETE */
  ipcMain.handle(`${PREFIX}:cancelTask`, (_, id: string) => {
    return NaraG2bController.cancelTask(id);
  });

  ipcMain.handle(`${PREFIX}:runTask`, (_, id: string) => {
    return NaraG2bController.runTask(id);
  });

  ipcMain.handle(`${PREFIX}:scheduleTask`, (_, id: string) => {
    return NaraG2bController.scheduleTask(id);
  });
};
