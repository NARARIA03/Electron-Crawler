import type { TStatusFE } from "@/types";

export type NaraG2bTaskFE = {
  id: string;
  data: NaraG2bDataFE[] | null;
  scheduledTime?: Date;
  excelName: string | null;
  baseDir: string | null;
  status: TStatusFE;
  debug: boolean;
};

export type NaraG2bDataFE = {
  query: string; // 검색어 - 신발장
  startDate: string;
  endDate: string;
  organization: string; // 기관명 - 개운중학교
  region: string; // 지역 - 서울
};
