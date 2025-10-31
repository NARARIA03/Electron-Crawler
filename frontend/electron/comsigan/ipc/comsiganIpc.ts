import { ipcMain } from "electron";
import ComsiganController, { type ComsiganTask } from "../controller/Comsigan.controller";

export const comsiganIpc = () => {
  /** READ */
  ipcMain.handle("comsigan:getAllTasks", () => {
    return ComsiganController.getAllTasks();
  });

  /** CREATE */
  ipcMain.handle("comsigan:addTask", (_, task: ComsiganTask) => {
    return ComsiganController.addTask(task);
  });

  /** UPDATE */
  ipcMain.handle("comsigan:updateTask", (_, id: string, newValue: Partial<ComsiganTask>) => {
    return ComsiganController.updateTask(id, newValue);
  });

  ipcMain.handle("comsigan:updateTaskAll", (_, newValue: Partial<ComsiganTask>) => {
    return ComsiganController.updateTaskAll(newValue);
  });

  /** DELETE */
  ipcMain.handle("comsigan:cancelTask", (_, id: string) => {
    return ComsiganController.cancelTask(id);
  });

  ipcMain.handle("comsigan:runTask", (_, id: string) => {
    return ComsiganController.runTask(id);
  });

  ipcMain.handle("comsigan:scheduleTask", (_, id: string) => {
    return ComsiganController.scheduleTask(id);
  });
};
