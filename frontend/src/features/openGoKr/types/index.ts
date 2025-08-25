export type OpenGoKrTaskFE = {
  id: string;
  data: unknown[] | null;
  scheduledTime?: Date;
  excelName: string | null;
  baseDir: string | null;
  status: "대기중" | "예약완료" | "작업중" | "작업완료" | "작업실패" | "취소됨";
  debug: string | null;
};
