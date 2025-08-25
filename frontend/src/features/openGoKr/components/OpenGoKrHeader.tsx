import { H2 } from "@/components";
import { ArrowLeft, Settings } from "lucide-react";
import { overlay } from "overlay-kit";
import OpenGoKrSettingModal from "./OpenGoKrSettingModal";
import { useNavigate } from "react-router-dom";

const OpenGoKrHeader = () => {
  const navigate = useNavigate();

  const goToBack = () => navigate(-1);

  return (
    <div className="w-full px-12 pt-12 flex justify-between items-center">
      <ArrowLeft className="cursor-pointer hover:text-primary/60" onClick={goToBack} />
      <H2>정보공개포털 페이지</H2>
      <Settings
        className="cursor-pointer hover:text-primary/60"
        onClick={() => overlay.open(({ isOpen, close }) => <OpenGoKrSettingModal isOpen={isOpen} onClose={close} />)}
      />
    </div>
  );
};

export default OpenGoKrHeader;
