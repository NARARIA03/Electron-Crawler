import { Button, H1 } from "@/components";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const OpenGoKrContainer = () => {
  const navigate = useNavigate();

  const goToBack = () => navigate(-1);

  const handleTestStart = () => {
    console.log("🔔 handleTestStart 호출");
    window.ipcRenderer.send("run-python", {
      type: "open-go-kr",
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
    window.ipcRenderer.on("python-result", (_event, result) => {
      const { exitCode, stdout, stderr } = result;
      if (exitCode === 0) {
        console.log("수집 성공:", stdout);
      } else {
        console.error("수집 실패:", stderr || stdout);
      }
    });

    return () => {
      window.ipcRenderer.off("python-result", () => {});
    };
  }, []);

  return (
    <>
      <H1>정보공개포털 페이지</H1>
      <Button variant="secondary" size="lg" onClick={goToBack}>
        뒤로가기
      </Button>
      <Button variant="secondary" size="lg" onClick={handleTestStart}>
        데이터 수집 시작
      </Button>
    </>
  );
};
