import { ipcMain } from "electron";
import OpenGoKrService, { type Task } from "../services/OpenGoKrService";

export const openGoKrIpc = () => {
  /** READ */
  ipcMain.handle("openGoKr:getAllTasks", () => {
    return OpenGoKrService.getAllTasks();
  });

  /** CREATE */
  ipcMain.handle("openGoKr:addTask", (_, task: Task) => {
    return OpenGoKrService.addTask(task);
  });

  /** UPDATE */
  ipcMain.handle("openGoKr:updateTask", (_, id: string, newValue: Partial<Task>) => {
    return OpenGoKrService.updateTask(id, newValue);
  });

  ipcMain.handle("openGoKr:updateTaskAll", (_, newValue: Partial<Task>) => {
    return OpenGoKrService.updateTaskAll(newValue);
  });

  /** DELETE */
  ipcMain.handle("openGoKr:cancelTask", (_, id: string) => {
    return OpenGoKrService.cancelTask(id);
  });

  ipcMain.handle("openGoKr:runTask", (_, id: string) => {
    return OpenGoKrService.runTask(id);
  });

  ipcMain.handle("openGoKr:scheduleTask", (_, id: string) => {
    return OpenGoKrService.scheduleTask(id);
  });
};
