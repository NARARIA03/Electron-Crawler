import { OPEN_FINDER, PYTHON } from "@/constants/ipc";
import { getDownloadDirectory, getExcelName } from "@/lib/localstorage";
import { IpcRendererEvent } from "electron";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useIPC = (type: "open-go-kr" | "nara-g2b-portal" | "computime-alert") => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [log, setLog] = useState<string>("");

  const handleStartIPC = (data: any[]) => {
    if (isLoading) return;

    const downloadDir = getDownloadDirectory();
    const excelName = getExcelName();
    setIsLoading(true);
    window.ipcRenderer.send(PYTHON.run, {
      type,
      data,
      downloadDir,
      excelName,
    });
  };

  useEffect(() => {
    const onStdout = (_: IpcRendererEvent, text: string) => {
      console.log("⏺ stdout 수신:", JSON.stringify(text));
      setLog(text);
      const match = text.match(/DIRECTORY:(.+)/);
      if (match && match[1]) {
        const folderDir = match[1].trim();
        window.ipcRenderer.send(OPEN_FINDER, folderDir);
      }
    };
    const onStderr = (_: IpcRendererEvent, text: string) => {
      console.error("stderr:", text);
      setLog(text);
    };
    const onResult = (_: IpcRendererEvent, result: { exitCode: number }) => {
      console.log("exitCode:", result.exitCode);
      setIsLoading(false);
      toast.success("작업이 완료되었습니다");
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
