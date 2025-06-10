import { Button, H1, Alert, ModalRoot, Loading } from "@/components";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDownloadDirectory, setDownloadDirectory } from "@/lib/localstorage";
import { OPEN_FINDER, PYTHON, SELECT_DIRECTORY } from "@/constants/ipc";
import { toast } from "sonner";
import type { IpcRendererEvent } from "electron";

export const OpenGoKrContainer = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [stdOut, setStdOut] = useState<string>("");

  const goToBack = () => navigate(-1);

  const handleDirectoryChange = async () => {
    const dir = (await window.ipcRenderer.invoke(SELECT_DIRECTORY)) as string | null;
    if (!dir) return;
    console.log(dir);
    setDownloadDirectory(dir);
  };

  const handleTestStart = () => {
    console.log("🔔 handleTestStart 호출");
    const downloadDir = getDownloadDirectory();
    setIsOpen(true);
    window.ipcRenderer.send(PYTHON.run, {
      type: "open-go-kr",
      downloadDir,
      data: [
        {
          query: "전자칠판",
          organization: "서울서일초등학교",
          location: "서울특별시교육청",
          startDate: "2025-02-19",
          endDate: "2025-05-22",
        },
      ],
    });
  };

  useEffect(() => {
    const onStdout = (_: IpcRendererEvent, text: string) => {
      console.log("⏺ stdout 수신:", JSON.stringify(text));
      setStdOut(text);
      const match = text.match(/DIRECTORY:(.+)/);
      if (match && match[1]) {
        const folderDir = match[1].trim();
        window.ipcRenderer.send(OPEN_FINDER, folderDir);
      }
    };
    const onStderr = (_: IpcRendererEvent, text: string) => {
      console.error("stderr:", text);
      setStdOut(text);
    };
    const onResult = (_: IpcRendererEvent, result: { exitCode: number }) => {
      console.log("exitCode:", result.exitCode);
      setIsOpen(false);
      toast.success("작업이 완료되었습니다");
      setStdOut("");
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

  return (
    <>
      <H1>정보공개포털 페이지</H1>
      <div className="flex gap-24">
        <Button variant="secondary" size="lg" onClick={goToBack}>
          뒤로가기
        </Button>
        <Button variant="secondary" size="lg" onClick={handleDirectoryChange}>
          다운로드 경로 변경
        </Button>
        <Button variant="secondary" size="lg" onClick={handleTestStart}>
          데이터 수집 시작
        </Button>
      </div>
      <ModalRoot isOpen={isOpen}>
        <Loading />
        <Alert className="w-fit absolute right-4 bottom-4">
          <Alert.Title>작업중...</Alert.Title>
          <Alert.Description className="text-xs">{stdOut}</Alert.Description>
        </Alert>
      </ModalRoot>
    </>
  );
};
