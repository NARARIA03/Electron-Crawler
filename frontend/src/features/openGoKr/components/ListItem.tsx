import { Input, Table } from "@/components";
import type { Task } from "../types";
import { Play, Send, Trash2 } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { parseExcelQuery } from "../utils";
import { getDebugMode, getDownloadDirectory } from "@/lib/localstorage";
import {
  runTaskIPC,
  scheduledTaskIPC,
  setTaskQueryIPC,
  setScheduledTimeIPC,
  initializeTaskIPC,
  cancelTaskIPC,
} from "../utils/ipc";

type Props = {
  task: Task;
};

const ListItem = ({ task }: Props) => {
  const [time, setTime] = useState<string>("");
  const { id, data, excelName, scheduledTime, status } = task;

  const statusColor = (() => {
    if (status === "대기중") return "text-gray-400";
    if (status === "예약완료") return "text-blue-400";
    if (status === "작업중") return "text-orange-400";
    if (status === "작업완료") return "text-green-400";
    if (status === "작업실패") return "text-red-400";
  })();

  const handleScheduledTimeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const time = new Date(e.target.value);
      setTime(e.target.value);
      await setScheduledTimeIPC(id, time);
    } catch (error) {
      console.error("예약 시간 설정 오류:", error);
      toast.error(`예약 시간 설정에 실패했습니다. ${error}`);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedQuery = await parseExcelQuery(file);
      await setTaskQueryIPC(id, file.name, parsedQuery);
      toast.success("검색 엑셀 로드 성공.");
      console.log(parsedQuery);
    } catch (error) {
      await setTaskQueryIPC(id, null, null);
      console.error("엑셀 파싱 오류", error);
      toast.error(`검색 엑셀 로드에 실패했습니다. ${error}`);
    }
  };

  const handleStartAfter = async () => {
    if (!scheduledTime) return toast.error("먼저 시작 예약 시간을 설정해주세요.");
    if (!data || !excelName) return toast.error("검색 엑셀을 다시 업로드해주세요.");
    if (status === "작업중") return toast.error("이미 작업이 진행 중입니다. 작업이 끝난 후 시도해주세요");

    try {
      await scheduledTaskIPC(id);
      toast.success("예약 시간에 작업이 예약되었습니다.");
    } catch (error) {
      console.error("예약 작업 설정 오류:", error);
      toast.error(`예약 작업 설정에 실패했습니다. ${error}`);
    }
  };

  const handleStartNow = async () => {
    if (!data) return toast.error("먼저 검색 엑셀을 업로드해주세요.");
    if (status === "작업중") return toast.error("이미 작업이 진행 중입니다. 작업이 끝난 후 시도해주세요");

    try {
      await runTaskIPC(id);
      toast.success("작업을 수행 중입니다.");
    } catch (error) {
      console.error("작업 실행 오류:", error);
      toast.error(`작업 실행에 실패했습니다. ${error}`);
    }
  };

  const handleCancelTask = async () => {
    try {
      await cancelTaskIPC(id);
      toast.success("작업을 취소했습니다.");
    } catch (error) {
      console.error("작업 취소 오류:", error);
      toast.error(`작업 취소에 실패했습니다. ${error}`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const baseDir = getDownloadDirectory();
        const debug = getDebugMode();
        initializeTaskIPC(id, baseDir, debug);
      } catch (error) {
        console.error("태스크 초기화 오류:", error);
      }
    })();
  }, [id]);

  return (
    <Table.Row>
      <Table.Cell className="w-[150px]">
        <Input type="file" accept=".xlsx, .xls" className="w-[150px]" onChange={handleFileChange} />
      </Table.Cell>
      <Table.Cell className="w-[200px]">
        <Input type="datetime-local" className="w-[200px]" value={time} onChange={handleScheduledTimeChange} />
      </Table.Cell>
      <Table.Cell>
        <p className={`text-xs ${data?.length ? "text-green-600" : "text-red-600"}`}>{data?.length ?? 0}행</p>
      </Table.Cell>
      <Table.Cell>
        <Send
          size={20}
          className={`${
            status === "작업중" ? "text-gray-400 cursor-not-allowed" : "hover:text-red-500 cursor-pointer"
          }`}
          onClick={handleStartAfter}
        />
      </Table.Cell>
      <Table.Cell>
        <Play
          size={20}
          className={`${
            status === "작업중" ? "text-gray-400 cursor-not-allowed" : "hover:text-red-500 cursor-pointer"
          }`}
          onClick={handleStartNow}
        />
      </Table.Cell>
      <Table.Cell>
        <span className={`text-xs ${statusColor}`}>{status}</span>
      </Table.Cell>
      <Table.Cell>
        <Trash2 className="cursor-pointer hover:text-red-500" size={20} onClick={handleCancelTask} />
      </Table.Cell>
    </Table.Row>
  );
};

export default ListItem;
