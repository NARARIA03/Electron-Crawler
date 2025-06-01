import { Button, H1 } from "@/components";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDownloadDirectory, setDownloadDirectory } from "@/lib/localstorage";
import { PYTHON, SELECT_DIRECTORY } from "@/constants/ipc";

export const OpenGoKrContainer = () => {
  const navigate = useNavigate();

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
    const onStdout = (_: Electron.IpcRendererEvent, text: string) => {
      console.log("stdout:", text);
    };
    const onStderr = (_: Electron.IpcRendererEvent, text: string) => {
      console.error("stderr:", text);
    };
    const onResult = (_: Electron.IpcRendererEvent, result: { exitCode: number }) => {
      console.log("exitCode:", result.exitCode);
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
      <Button variant="secondary" size="lg" onClick={goToBack}>
        뒤로가기
      </Button>
      <Button variant="secondary" size="lg" onClick={handleDirectoryChange}>
        다운로드 경로 변경
      </Button>
      <Button variant="secondary" size="lg" onClick={handleTestStart}>
        데이터 수집 시작
      </Button>
    </>
  );
};
