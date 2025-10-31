import { PREFIX } from "../constants";
import type { OpenGoKrTaskFE } from "../types";

export const getAllTasksIPC = (): Promise<OpenGoKrTaskFE[]> => {
  return window.ipcRenderer.invoke(`${PREFIX}:getAllTasks`);
};

export const addRowIPC = () => {
  const id = Date.now().toString();
  const newTask: OpenGoKrTaskFE = {
    id,
    data: null,
    excelName: null,
    baseDir: null,
    status: "대기중",
    debug: null,
  };
  return window.ipcRenderer.invoke(`${PREFIX}:addTask`, newTask);
};

export const setScheduledTimeIPC = (id: string, scheduledTime: Date) => {
  return window.ipcRenderer.invoke(`${PREFIX}:updateTask`, id, { scheduledTime });
};

export const setTaskQueryIPC = (id: string, excelName: string | null, data: unknown[] | null) => {
  return window.ipcRenderer.invoke(`${PREFIX}:updateTask`, id, { excelName, data });
};

export const initializeTaskIPC = (id: string, baseDir: string | null, debug: string | null) => {
  return window.ipcRenderer.invoke(`${PREFIX}:updateTask`, id, { baseDir, debug });
};

export const updateTaskAllIPC = (newValue: Partial<OpenGoKrTaskFE>) => {
  return window.ipcRenderer.invoke(`${PREFIX}:updateTaskAll`, newValue);
};

export const scheduledTaskIPC = (id: string) => {
  return window.ipcRenderer.invoke(`${PREFIX}:scheduleTask`, id);
};

export const runTaskIPC = (id: string) => {
  return window.ipcRenderer.invoke(`${PREFIX}:runTask`, id);
};

export const cancelTaskIPC = (id: string) => {
  return window.ipcRenderer.invoke(`${PREFIX}:cancelTask`, id);
};
