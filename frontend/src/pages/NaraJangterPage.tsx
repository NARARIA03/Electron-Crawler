import { Button, H1 } from "@/components";
import { useNavigate } from "react-router-dom";

export const NaraJangterPage = () => {
  const navigate = useNavigate();

  const goToBack = () => navigate(-1);

  return (
    <>
      <H1>나라장터 페이지</H1>
      <Button variant="secondary" size="lg" onClick={goToBack}>
        뒤로가기
      </Button>
    </>
  );
};
