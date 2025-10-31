import type { TStatusFE } from "@/types";

export type OpenGoKrTaskFE = {
  id: string;
  data: unknown[] | null;
  scheduledTime?: Date;
  excelName: string | null;
  baseDir: string | null;
  status: TStatusFE;
  debug: string | null;
};
