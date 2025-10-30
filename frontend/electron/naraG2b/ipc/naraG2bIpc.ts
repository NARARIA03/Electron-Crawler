import { ipcMain } from "electron";
import NaraG2bController, { type NaraG2bTask } from "../controller/NaraG2b.controller";

export const naraG2bIpc = () => {
  /** READ */
  ipcMain.handle("naraG2b:getAllTasks", () => {
    return NaraG2bController.getAllTasks();
  });

  /** CREATE */
  ipcMain.handle("naraG2b:addTask", (_, task: NaraG2bTask) => {
    return NaraG2bController.addTask(task);
  });

  /** UPDATE */
  ipcMain.handle("naraG2b:updateTask", (_, id: string, newValue: Partial<NaraG2bTask>) => {
    return NaraG2bController.updateTask(id, newValue);
  });

  ipcMain.handle("naraG2b:updateTaskAll", (_, newValue: Partial<NaraG2bTask>) => {
    return NaraG2bController.updateTaskAll(newValue);
  });

  /** DELETE */
  ipcMain.handle("naraG2b:cancelTask", (_, id: string) => {
    return NaraG2bController.cancelTask(id);
  });

  ipcMain.handle("naraG2b:runTask", (_, id: string) => {
    return NaraG2bController.runTask(id);
  });

  ipcMain.handle("naraG2b:scheduleTask", (_, id: string) => {
    return NaraG2bController.scheduleTask(id);
  });
};
