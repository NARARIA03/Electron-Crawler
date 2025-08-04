import { Button, Table } from "@/components";
import { useOpenGoKrStore } from "../store";
import { Plus } from "lucide-react";
import ListItem from "./ListItem";

const List = () => {
  const { queryItems, addRow } = useOpenGoKrStore();

  return (
    <>
      <div className="flex w-full px-12 justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          <p>각 행별로 독립적인 예약/실행이 가능합니다.</p>
          <p>프로그램을 종료하면 예약/실행 중인 작업이 모두 취소됩니다.</p>
        </div>
        <Button onClick={addRow} className="flex items-center gap-2">
          <Plus size={16} />
          검색 행 추가
        </Button>
      </div>
      <div className="w-full px-12">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-[150px] text-xs">검색 엑셀 업로드</Table.Head>
              <Table.Head className="w-[200px] text-xs">시작 예약 시간</Table.Head>
              <Table.Head className="text-xs">인식된 행 수</Table.Head>
              <Table.Head className="text-xs">작업 예약</Table.Head>
              <Table.Head className="text-xs">즉시 실행</Table.Head>
              <Table.Head className="text-xs">상태</Table.Head>
              <Table.Head className="text-xs">삭제</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {queryItems.map((queryItem) => (
              <ListItem key={queryItem.id} queryItem={queryItem} />
            ))}
          </Table.Body>
        </Table>
      </div>
    </>
  );
};

export default List;
