import { Button, H1, Paragraph } from "@/components";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const LandingPage = () => {
  const navigate = useNavigate();

  const onOpenGoKrClick = () => navigate("/openGoKr");

  const handleNotImplementedClick = () => toast.warning("아직 구현 중인 기능입니다.");

  return (
    <>
      <H1>크롤링 서비스 (Beta)</H1>
      <div className="flex justify-center items-center gap-24">
        <Button variant="secondary" size="lg" onClick={onOpenGoKrClick}>
          <Paragraph>정보공개포털</Paragraph>
        </Button>
        <Button variant="secondary" size="lg" onClick={handleNotImplementedClick}>
          <Paragraph>컴시간알리미</Paragraph>
        </Button>
        <Button variant="secondary" size="lg" onClick={handleNotImplementedClick}>
          <Paragraph>나라장터</Paragraph>
        </Button>
      </div>
    </>
  );
};
