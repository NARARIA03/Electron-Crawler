import { Button } from "@/components";
import { Switch } from "@/components/ui/switch";
import { DOWNLOAD_QUERY_EXCEL, SELECT_DIRECTORY } from "@/constants/ipc";
import { getDebugMode, getDownloadDirectory, setDebugMode, setDownloadDirectory } from "@/lib/localstorage";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updateTaskAllIPC } from "../utils/ipc";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const NaraG2bSettingModal = ({ isOpen, onClose }: Props) => {
  const [downloadDir, setDownloadDir] = useState<string | null>(() => getDownloadDirectory());
  const [debug, setDebug] = useState<boolean>(() => getDebugMode());

  const handleDownloadDirChange = async () => {
    try {
      const dir = (await window.ipcRenderer.invoke(SELECT_DIRECTORY)) as string | null;
      if (dir) {
        setDownloadDirectory(dir);
        updateTaskAllIPC({ baseDir: dir });
        setDownloadDir(dir);
        toast.success("저장 경로 변경 성공");
      }
    } catch (e) {
      console.error(e);
      toast.error("에러 발생, 재시도해주세요.");
    }
  };

  const handleDebugCheckedChange = (checked: boolean) => {
    setDebug(checked);
    updateTaskAllIPC({ debug: checked });
    setDebugMode(checked);
  };

  const handleDownloadQueryExcel = () => {
    try {
      window.ipcRenderer.invoke(DOWNLOAD_QUERY_EXCEL, "나라장터query.xlsx");
      toast.success("다운로드 폴더에 나라장터 검색어 설정용 xlsx가 저장되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("다운로드 중 에러가 발생했습니다");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center backdrop-blur-2xl bg-zinc-800/40 z-10"
      onPointerDown={onClose}
    >
      <div
        className="w-2/3 h-2/3 overflow-y-auto bg-zinc-100 rounded-2xl no-scrollbar p-12"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="relative flex gap-24 justify-center items-center mb-12">
          <ArrowLeft className="absolute left-0 top-1 hover:text-primary/60" onClick={onClose} />
          <p className="text-xl font-bold select-none">설정</p>
        </div>
        <div className="w-full h-full">
          <div className="mb-8">
            <p className="text-zinc-600 mb-2 select-none">데이터 저장 경로:</p>
            <div
              className="p-2 rounded-lg border border-zinc-700 select-none cursor-pointer hover:bg-zinc-200"
              onClick={handleDownloadDirChange}
            >
              {downloadDir ?? "클릭해서 경로를 설정해주세요."}
            </div>
          </div>
          <div className="mb-8">
            <p className="text-zinc-600 mb-2 select-none">나라장터 검색 설정용 xlsx 다운로드:</p>
            <Button className="w-full mt-2" onClick={handleDownloadQueryExcel}>
              다운로드
            </Button>
          </div>
          <div className="mb-8 pb-4">
            <p className="text-zinc-600 mb-2 select-none">디버깅 모드:</p>
            <Switch checked={debug} onCheckedChange={handleDebugCheckedChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NaraG2bSettingModal;
