import { Button, H1 } from "@/components";
import { useNavigate } from "react-router-dom";

export const OpenGoKrPage = () => {
  const navigate = useNavigate();

  const goToBack = () => navigate(-1);

  return (
    <>
      <H1>정보공개포털 페이지</H1>
      <Button variant="secondary" size="lg" onClick={goToBack}>
        뒤로가기
      </Button>
    </>
  );
};
