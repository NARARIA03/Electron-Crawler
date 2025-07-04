import { Button, Input } from "@/components";
import { Switch } from "@/components/ui/switch";
import { DOWNLOAD_QUERY_EXCEL, SELECT_DIRECTORY } from "@/constants/ipc";
import {
  getDebugMode,
  getDownloadDirectory,
  getExcelName,
  setDebugMode,
  setDownloadDirectory,
  setExcelName,
} from "@/lib/localstorage";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingModal = ({ isOpen, onClose }: Props) => {
  const [downloadDir, setDownloadDir] = useState<string | null>(() => getDownloadDirectory());
  const [excelFileName, setExcelFileName] = useState<string | null>(() => getExcelName());
  const [debug, setDebug] = useState<string | null>(() => getDebugMode());

  const isExcelNameChanged = excelFileName !== getExcelName();

  const handleDownloadDirChange = async () => {
    try {
      const dir = (await window.ipcRenderer.invoke(SELECT_DIRECTORY)) as string | null;
      if (dir) {
        setDownloadDirectory(dir);
        setDownloadDir(dir);
        toast.success("저장 경로 변경 성공");
      }
    } catch (e) {
      console.error(e);
      toast.error("에러 발생, 재시도해주세요.");
    }
  };

  const handleDebugCheckedChange = (checked: boolean) => {
    setDebug(JSON.stringify(checked));
    setDebugMode(checked);
  };

  const handleExcelFileNameChange = () => {
    if (!excelFileName) return;

    const fileNameWithExtension = /\.xlsx$/i.test(excelFileName)
      ? excelFileName
      : excelFileName.replace(/\.[^/\\.]*$/, "") + ".xlsx";
    setExcelFileName(fileNameWithExtension);
    setExcelName(fileNameWithExtension);
  };

  const handleDownloadQueryExcel = () => {
    try {
      window.ipcRenderer.invoke(DOWNLOAD_QUERY_EXCEL);
      toast.success("다운로드 폴더에 검색어 설정용 xlsx가 저장되었습니다.");
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
          <ArrowLeft className="absolute left-0 top-1" onClick={onClose} />
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
            <p className="text-zinc-600 mb-2 select-none">저장될 xlsx 파일명:</p>
            <Input
              className="h-10 rounded-lg border border-zinc-700 select-none cursor-pointer hover:bg-zinc-200"
              placeholder="database.xlsx 처럼 입력해주세요"
              value={excelFileName ?? ""}
              onChange={(e) => setExcelFileName(e.target.value)}
            />
            {isExcelNameChanged && (
              <Button className="w-full mt-2" onClick={handleExcelFileNameChange}>
                변경사항 저장
              </Button>
            )}
          </div>
          <div className="mb-8">
            <p className="text-zinc-600 mb-2 select-none">검색 설정용 xlsx 다운로드:</p>
            <Button className="w-full mt-2" onClick={handleDownloadQueryExcel}>
              다운로드
            </Button>
          </div>
          <div className="mb-8 pb-4">
            <p className="text-zinc-600 mb-2 select-none">디버깅 모드:</p>
            <Switch checked={debug === "true"} onCheckedChange={handleDebugCheckedChange} />
          </div>
        </div>
      </div>
    </div>
  );
};
