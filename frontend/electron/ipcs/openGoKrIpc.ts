import { ipcMain } from "electron";
import OpenGoKrService, { type RunTaskArgs, type ScheduleTaskArgs } from "../services/OpenGoKrService";

export const openGoKrIpc = () => {
  ipcMain.handle("openGoKr:getAllTasks", () => {
    return OpenGoKrService.getAllTasks();
  });

  ipcMain.handle("openGoKr:getTask", (_, id: string) => {
    return OpenGoKrService.getTask(id);
  });

  ipcMain.handle("openGoKr:runTask", (_, args: RunTaskArgs) => {
    try {
      return { success: true, id: OpenGoKrService.runTask(args) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle("openGoKr:scheduleTask", (_, args: ScheduleTaskArgs) => {
    try {
      return { success: true, id: OpenGoKrService.scheduleTask(args) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle("openGoKr:cancelTask", (_, id: string) => {
    return { success: OpenGoKrService.cancelTask(id) };
  });
};
