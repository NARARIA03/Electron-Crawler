type TaskResult = {
  success: boolean;
  id?: string;
  error?: string;
};

export const useOpenGoKrIpc = () => {
  const getAllTasks = async () => {
    return await window.ipcRenderer.invoke("openGoKr:getAllTasks");
  };

  const getTask = async (id: string) => {
    return await window.ipcRenderer.invoke("openGoKr:getTask", id);
  };

  const runTask = async (args: {
    id: string;
    data: unknown[];
    baseDir: string | null;
    excelName: string | null;
    debug: string | null;
  }): Promise<TaskResult> => {
    return await window.ipcRenderer.invoke("openGoKr:runTask", args);
  };

  const scheduleTask = async (args: {
    id: string;
    data: unknown[];
    baseDir: string | null;
    excelName: string | null;
    debug: string | null;
    scheduledTime: string;
  }): Promise<TaskResult> => {
    return await window.ipcRenderer.invoke("openGoKr:scheduleTask", args);
  };

  const cancelTask = async (id: string) => {
    return await window.ipcRenderer.invoke("openGoKr:cancelTask", id);
  };

  return { getAllTasks, getTask, runTask, scheduleTask, cancelTask };
};
