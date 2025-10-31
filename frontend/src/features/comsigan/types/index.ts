import type { TStatusFE } from "@/types";

export type ComsiganTaskFE = {
  id: string;
  data: ComsiganDataFE[] | null;
  scheduledTime?: Date;
  excelName: string | null;
  baseDir: string | null;
  status: TStatusFE;
  debug: boolean;
};

export type ComsiganDataFE = {
  schoolName: string;
  region: string;
  teacherName: string;
};
