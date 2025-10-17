import type { NaraG2bDataFE, NaraG2bTaskFE } from "../types";

export const getAllTasksIPC = (): Promise<NaraG2bTaskFE[]> => {
  return window.ipcRenderer.invoke("naraG2b:getAllTasks");
};

export const addRowIPC = () => {
  const id = Date.now().toString();
  const newTask: NaraG2bTaskFE = {
    id,
    data: null,
    excelName: null,
    baseDir: null,
    status: "대기중",
    debug: false,
  };
  return window.ipcRenderer.invoke("naraG2b:addTask", newTask);
};

export const setScheduledTimeIPC = (id: string, scheduledTime: Date) => {
  return window.ipcRenderer.invoke("naraG2b:updateTask", id, { scheduledTime });
};

export const setTaskQueryIPC = (id: string, excelName: string | null, data: NaraG2bDataFE[] | null) => {
  return window.ipcRenderer.invoke("naraG2b:updateTask", id, { excelName, data });
};

export const initializeTaskIPC = (id: string, baseDir: string | null, debug: boolean) => {
  return window.ipcRenderer.invoke("naraG2b:updateTask", id, { baseDir, debug });
};

export const updateTaskAllIPC = async (newValue: Partial<NaraG2bTaskFE>) => {
  return window.ipcRenderer.invoke("naraG2b:updateTaskAll", newValue);
};

export const scheduledTaskIPC = (id: string) => {
  return window.ipcRenderer.invoke("naraG2b:scheduleTask", id);
};

export const runTaskIPC = (id: string) => {
  return window.ipcRenderer.invoke("naraG2b:runTask", id);
};

export const cancelTaskIPC = (id: string) => {
  return window.ipcRenderer.invoke("naraG2b:cancelTask", id);
};
