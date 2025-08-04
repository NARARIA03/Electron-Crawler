import { Input, Table } from "@/components";
import type { TQueryItem } from "../types";
import { Play, Send, Trash2 } from "lucide-react";
import { useOpenGoKrStore } from "../store";
import { ChangeEvent } from "react";
import { toast } from "sonner";
import { parseExcelQuery } from "../utils";

type Props = {
  queryItem: TQueryItem;
};

const ListItem = ({ queryItem }: Props) => {
  const { setQuery, setscheduledTime, setStatus, removeRow } = useOpenGoKrStore();

  const { id, query, scheduledTime, status } = queryItem;

  const statusColor = (() => {
    if (status === "대기중") return "text-gray-400";
    if (status === "예약완료") return "text-blue-400";
    if (status === "작업중") return "text-red-400";
    if (status === "작업완료") return "text-green-400";
  })();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedQuery = await parseExcelQuery(file);
      setQuery(id, parsedQuery);
      toast.success("정상적으로 검색 엑셀을 불러왔습니다.");
      console.log(parsedQuery);
    } catch (error) {
      setQuery(id, null);
      console.error("엑셀 파싱 오류", error);
      toast.error(`엑셀 형식이 잘못되었습니다. 확인 후 재업로드해주세요. 에러 메시지: ${error}`);
    }
  };

  const handleStartAfter = () => {
    if (!scheduledTime) return toast.error("먼저 시작 예약 시간을 설정해주세요.");
    if (!query) return toast.error("먼저 검색 엑셀을 업로드해주세요.");
    if (status === "작업중") return toast.error("이미 작업이 진행 중입니다. 작업이 끝난 후 시도해주세요");
    setStatus(id, "예약완료");

    toast.success("예약 시간에 작업이 예약되었습니다.");
    // Todo: IPC 연결
  };

  const handleStartNow = () => {
    if (!query) return toast.error("먼저 검색 엑셀을 업로드해주세요.");
    if (status === "작업중") return toast.error("이미 작업이 진행 중입니다. 작업이 끝난 후 시도해주세요");
    setStatus(id, "작업중");

    // Todo: IPC 연결
  };

  return (
    <Table.Row>
      <Table.Cell className="w-[150px]">
        <Input type="file" accept=".xlsx, .xls" className="w-[150px]" onChange={handleFileChange} />
      </Table.Cell>
      <Table.Cell className="w-[200px]">
        <Input
          type="datetime-local"
          className="w-[200px]"
          value={scheduledTime ?? ""}
          onChange={(e) => setscheduledTime(id, e.target.value)}
        />
      </Table.Cell>
      <Table.Cell>
        <p className={`text-xs ${query?.length ? "text-green-600" : "text-red-600"}`}>{query?.length ?? 0}행</p>
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
        <Trash2 className="cursor-pointer hover:text-red-500" size={20} onClick={() => removeRow(id)} />
      </Table.Cell>
    </Table.Row>
  );
};

export default ListItem;
