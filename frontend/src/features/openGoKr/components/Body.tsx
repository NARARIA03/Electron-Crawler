import { Alert, Input, Table } from "@/components";
import { useIPC } from "@/hooks";
import { Play, Send } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { parseExcelQuery } from "../utils";
import { toast } from "sonner";

export const Body = () => {
  const [query, setQuery] = useState<unknown[] | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | undefined>(undefined);

  const { isLoading, log, handleStartIPC } = useIPC("open-go-kr");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedQuery = await parseExcelQuery(file);
      setQuery(parsedQuery);
      toast.success("정상적으로 검색 엑셀을 불러왔습니다.");
      console.log(parsedQuery);
    } catch (error) {
      setQuery(null);
      console.error("엑셀 파싱 오류:", error);
      toast.error("엑셀 형식이 잘못되었습니다. 확인 후 재업로드해주세요.");
    }
  };

  const handleStartAfter = () => {
    if (!scheduledTime) return toast.error("먼저 시작 예약 시간을 설정해주세요.");
    if (!query) return toast.error("먼저 검색 엑셀을 업로드해주세요.");
    if (isLoading) return toast.error("이미 작업이 진행 중입니다. 작업이 끝난 후 시도해주세요");

    toast.success("예약 시간에 작업이 예약되었습니다. 예약은 1개만 가능하며, 덮어씌워집니다.");
    handleStartIPC(query, scheduledTime);
  };

  const handleStartNow = () => {
    if (!query) return toast.error("먼저 검색 엑셀을 업로드해주세요.");
    if (isLoading) return toast.error("이미 작업이 진행 중입니다. 작업이 끝난 후 시도해주세요");

    handleStartIPC(query);
  };

  return (
    <>
      <Table>
        <Table.Caption className="text-start">
          <p>하나의 작업만 예약/실행 가능하며, 여러 번 예약 시 마지막 예약 작업으로 덮어씌워집니다.</p>
          <p>프로그램을 종료하면 예약된 작업이 취소됩니다.</p>
          <p>예약 작업을 즉시 실행하면, 예약 작업은 취소됩니다.</p>
        </Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-[200px]">검색 엑셀 업로드</Table.Head>
            <Table.Head className="w-[200px]">시작 예약 시간</Table.Head>
            <Table.Head>작업 예약</Table.Head>
            <Table.Head>즉시 실행</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              <Input type="file" accept=".xlsx, .xls" className="w-[200px]" onChange={handleFileChange} />
            </Table.Cell>
            <Table.Cell>
              <Input type="datetime-local" className="w-[200px]" onChange={(e) => setScheduledTime(e.target.value)} />
            </Table.Cell>
            <Table.Cell>
              <Send className="hover:text-red-500" onClick={handleStartAfter} />
            </Table.Cell>
            <Table.Cell>
              <Play className="hover:text-red-500" onClick={handleStartNow} />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
      {isLoading && (
        <Alert className="w-[250px] absolute right-4 bottom-4">
          <Alert.Title>작업중...</Alert.Title>
          <Alert.Description className="text-xs text-ellipsis">{log}</Alert.Description>
        </Alert>
      )}
    </>
  );
};
