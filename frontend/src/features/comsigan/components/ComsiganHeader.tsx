import { H2 } from "@/components";
import { ArrowLeft, Settings } from "lucide-react";
import { overlay } from "overlay-kit";
import { useNavigate } from "react-router-dom";
import ComsiganSettingModal from "./ComsiganSettingModal";

const ComsiganHeader = () => {
  const navigate = useNavigate();

  const goToBack = () => navigate(-1);

  return (
    <div className="w-full px-12 pt-12 flex justify-between items-center">
      <ArrowLeft className="cursor-pointer hover:text-primary/60" onClick={goToBack} />
      <H2>컴시간알리미 페이지</H2>
      <Settings
        className="cursor-pointer hover:text-primary/60"
        onClick={() => overlay.open(({ isOpen, close }) => <ComsiganSettingModal isOpen={isOpen} onClose={close} />)}
      />
    </div>
  );
};

export default ComsiganHeader;
