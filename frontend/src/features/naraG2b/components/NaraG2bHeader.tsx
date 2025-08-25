import { H2 } from "@/components";
import { ArrowLeft, Settings } from "lucide-react";
import { overlay } from "overlay-kit";
import { useNavigate } from "react-router-dom";
import NaraG2bSettingModal from "./NaraG2bSettingModal";

const NaraG2bHeader = () => {
  const navigate = useNavigate();

  const goToBack = () => navigate(-1);

  return (
    <div className="w-full px-12 pt-12 flex justify-between items-center">
      <ArrowLeft className="cursor-pointer hover:text-primary/60" onClick={goToBack} />
      <H2>나라장터 페이지</H2>
      <Settings
        className="cursor-pointer hover:text-primary/60"
        onClick={() => overlay.open(({ isOpen, close }) => <NaraG2bSettingModal isOpen={isOpen} onClose={close} />)}
      />
    </div>
  );
};

export default NaraG2bHeader;
