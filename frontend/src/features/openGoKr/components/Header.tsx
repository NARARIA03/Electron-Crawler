import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { overlay } from "overlay-kit";
import { H2 } from "@/components";
import { SettingModal } from "./SettingModal";

export const Header = () => {
  const navigate = useNavigate();

  const goToBack = () => navigate(-1);

  return (
    <div className="w-full flex justify-between items-center">
      <ArrowLeft className="cursor-pointer" onClick={goToBack} />
      <H2>정보공개포털 페이지</H2>
      <Settings
        className="cursor-pointer"
        onClick={() => overlay.open(({ isOpen, close }) => <SettingModal isOpen={isOpen} onClose={close} />)}
      />
    </div>
  );
};
