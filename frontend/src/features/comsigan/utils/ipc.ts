import type { ComsiganDataFE, ComsiganTaskFE } from "../types";

const PREFIX = "comsigan";

export const getAllTasksIpc = (): Promise<ComsiganTaskFE[]> => {
  return window.ipcRenderer.invoke(`${PREFIX}:getAllTasks`);
};

export const addRowIPC = () => {
  const id = Date.now().toString();
  const newTask: ComsiganTaskFE = {
    id,
    data: null,
    excelName: null,
    baseDir: null,
    status: "대기중",
    debug: false,
  };
  return window.ipcRenderer.invoke(`${PREFIX}:addTask`, newTask);
};

export const setScheduledTimeIPC = (id: string, scheduledTime: Date) => {
  return window.ipcRenderer.invoke(`${PREFIX}:updateTask`, id, { scheduledTime });
};

export const setTaskQueryIPC = (id: string, excelName: string | null, data: ComsiganDataFE[] | null) => {
  return window.ipcRenderer.invoke(`${PREFIX}:updateTask`, id, { excelName, data });
};

export const initializeTaskIPC = (id: string, baseDir: string | null, debug: boolean) => {
  return window.ipcRenderer.invoke(`${PREFIX}:updateTask`, id, { baseDir, debug });
};

export const updateTaskAllIPC = async (newValue: Partial<ComsiganTaskFE>) => {
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
