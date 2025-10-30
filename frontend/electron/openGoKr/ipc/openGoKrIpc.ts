import { ipcMain } from "electron";
import OpenGoKrController, { type OpenGoKrTask } from "../controller/OpenGoKr.controller";

export const openGoKrIpc = () => {
  /** READ */
  ipcMain.handle("openGoKr:getAllTasks", () => {
    return OpenGoKrController.getAllTasks();
  });

  /** CREATE */
  ipcMain.handle("openGoKr:addTask", (_, task: OpenGoKrTask) => {
    return OpenGoKrController.addTask(task);
  });

  /** UPDATE */
  ipcMain.handle("openGoKr:updateTask", (_, id: string, newValue: Partial<OpenGoKrTask>) => {
    return OpenGoKrController.updateTask(id, newValue);
  });

  ipcMain.handle("openGoKr:updateTaskAll", (_, newValue: Partial<OpenGoKrTask>) => {
    return OpenGoKrController.updateTaskAll(newValue);
  });

  /** DELETE */
  ipcMain.handle("openGoKr:cancelTask", (_, id: string) => {
    return OpenGoKrController.cancelTask(id);
  });

  ipcMain.handle("openGoKr:runTask", (_, id: string) => {
    return OpenGoKrController.runTask(id);
  });

  ipcMain.handle("openGoKr:scheduleTask", (_, id: string) => {
    return OpenGoKrController.scheduleTask(id);
  });
};
