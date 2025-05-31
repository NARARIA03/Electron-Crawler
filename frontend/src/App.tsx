import { Button, H1, Paragraph } from "./components";
import { toast } from "sonner";

function App() {
  const handleNotImplementedClick = () => toast.warning("아직 구현 중인 기능입니다.");

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-24 bg-slate-800">
      <H1>크롤링 서비스 (Beta)</H1>
      <div className="flex justify-center items-center gap-24">
        <Button variant="secondary" size="lg" className="cursor-pointer">
          <Paragraph>정보공개포털</Paragraph>
        </Button>
        <Button variant="secondary" size="lg" className="cursor-pointer" onClick={handleNotImplementedClick}>
          <Paragraph>컴시간알리미</Paragraph>
        </Button>
        <Button variant="secondary" size="lg" className="cursor-pointer" onClick={handleNotImplementedClick}>
          <Paragraph>나라장터</Paragraph>
        </Button>
      </div>
    </div>
  );
}

export default App;
