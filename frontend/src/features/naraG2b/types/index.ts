export type NaraG2bTaskFE = {
  id: string;
  data: NaraG2bDataFE[] | null;
  scheduledTime?: Date;
  excelName: string | null;
  baseDir: string | null;
  status: "대기중" | "예약완료" | "작업중" | "작업완료" | "작업실패" | "취소됨";
  debug: boolean;
};

export type NaraG2bDataFE = {
  query: string; // 검색어 - 신발장
  startDate: string;
  endDate: string;
  organization?: string; // 기관명 - 개운중학교
};
