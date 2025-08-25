import type { OpenGoKrTaskFE } from "../types";

export const getAllTasksIPC = (): Promise<OpenGoKrTaskFE[]> => {
  return window.ipcRenderer.invoke("openGoKr:getAllTasks");
};

export const addRowIPC = async () => {
  const id = Date.now().toString();
  const newTask: OpenGoKrTaskFE = {
    id,
    data: null,
    excelName: null,
    baseDir: null,
    status: "대기중",
    debug: null,
  };
  return window.ipcRenderer.invoke("openGoKr:addTask", newTask);
};

export const setScheduledTimeIPC = async (id: string, scheduledTime: Date) => {
  return window.ipcRenderer.invoke("openGoKr:updateTask", id, { scheduledTime });
};

export const setTaskQueryIPC = async (id: string, excelName: string | null, data: unknown[] | null) => {
  return window.ipcRenderer.invoke("openGoKr:updateTask", id, { excelName, data });
};

export const initializeTaskIPC = async (id: string, baseDir: string | null, debug: string | null) => {
  return window.ipcRenderer.invoke("openGoKr:updateTask", id, { baseDir, debug });
};

export const updateTaskAllIPC = async (newValue: Partial<OpenGoKrTaskFE>) => {
  return window.ipcRenderer.invoke("openGoKr:updateTaskAll", newValue);
};

export const scheduledTaskIPC = async (id: string) => {
  return window.ipcRenderer.invoke("openGoKr:scheduleTask", id);
};

export const runTaskIPC = async (id: string) => {
  return window.ipcRenderer.invoke("openGoKr:runTask", id);
};

export const cancelTaskIPC = async (id: string) => {
  return window.ipcRenderer.invoke("openGoKr:cancelTask", id);
};
