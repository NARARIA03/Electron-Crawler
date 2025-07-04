import { OPEN_FINDER, PYTHON } from "@/constants/ipc";
import { getDebugMode, getDownloadDirectory, getExcelName } from "@/lib/localstorage";
import { IpcRendererEvent } from "electron";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useIPC = (type: "open-go-kr" | "nara-g2b-portal" | "computime-alert") => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [log, setLog] = useState<string>("");

  const handleStartIPC = (data: unknown[], scheduledTime?: string) => {
    if (isLoading) return;

    const downloadDir = getDownloadDirectory();
    const excelName = getExcelName();
    const debug = getDebugMode();
    if (!scheduledTime) setIsLoading(true);

    window.ipcRenderer.send(PYTHON.run, {
      type,
      data,
      downloadDir,
      excelName,
      scheduledTime,
      debug,
    });
  };

  useEffect(() => {
    const onStdout = (_: IpcRendererEvent, text: string) => {
      setIsLoading(true);
      console.log("stdout 수신:", JSON.stringify(text));
      setLog(text);

      const successDir = text.match(/DIRECTORY:(.+)/);
      const failedDir = text.match(/FAILDIRECTORY:(.+)/);

      if (successDir && successDir[1]) {
        const dir = successDir[1].trim();
        window.ipcRenderer.send(OPEN_FINDER, dir);
      } else if (failedDir && failedDir[1]) {
        const dir = failedDir[1].trim();
        console.log(`failedDir: ${dir}`);
        window.ipcRenderer.send(OPEN_FINDER, dir);
      }
    };

    const onStderr = (_: IpcRendererEvent, text: string) => {
      console.error("stderr:", text);
      setLog(text);
    };

    const onResult = (_: IpcRendererEvent, result: { exitCode: number }) => {
      console.log("exitCode:", result.exitCode);
      setIsLoading(false);
      !result.exitCode ? toast.success("작업이 완료되었습니다") : toast.error("작업이 실패했습니다");
      setLog("");
    };

    window.ipcRenderer.on(PYTHON.stdout, onStdout);
    window.ipcRenderer.on(PYTHON.stderr, onStderr);
    window.ipcRenderer.on(PYTHON.result, onResult);

    return () => {
      window.ipcRenderer.off(PYTHON.stdout, onStdout);
      window.ipcRenderer.off(PYTHON.stderr, onStderr);
      window.ipcRenderer.off(PYTHON.result, onResult);
    };
  }, []);

  return { isLoading, log, handleStartIPC };
};
