export type TQueryItem = {
  id: string;
  query: unknown[] | null;
  scheduledTime?: string;
  status: "대기중" | "예약완료" | "작업중" | "작업완료";
  log: string;
  processId?: string;
};
