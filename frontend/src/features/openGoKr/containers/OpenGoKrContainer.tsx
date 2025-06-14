import { Button, H1, Alert, ModalRoot, Loading } from "@/components";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { overlay } from "overlay-kit";
import { SettingModal } from "../components";
import { useIPC } from "@/hooks";

export const OpenGoKrContainer = () => {
  const navigate = useNavigate();
  const { isLoading, log, handleStartIPC } = useIPC("open-go-kr");

  const goToBack = () => navigate(-1);

  return (
    <>
      <div className="w-full flex gap-24 justify-center items-center">
        <ArrowLeft color="black" size={32} className="cursor-pointer" onClick={goToBack} />
        <H1>정보공개포털 페이지</H1>
        <Settings
          color="black"
          className="cursor-pointer"
          onClick={() => overlay.open(({ isOpen, close }) => <SettingModal isOpen={isOpen} onClose={close} />)}
        />
      </div>
      <div className="flex gap-24">
        <Button
          size="lg"
          onClick={() =>
            handleStartIPC([
              {
                query: "전자칠판",
                organization: "서울서일초등학교",
                location: "서울특별시교육청",
                startDate: "2025-02-19",
                endDate: "2025-05-22",
              },
            ])
          }
        >
          데이터 수집 시작
        </Button>
      </div>
      <ModalRoot isOpen={isLoading}>
        <Loading />
        <Alert className="w-fit absolute right-4 bottom-4">
          <Alert.Title>작업중...</Alert.Title>
          <Alert.Description className="text-xs">{log}</Alert.Description>
        </Alert>
      </ModalRoot>
    </>
  );
};
