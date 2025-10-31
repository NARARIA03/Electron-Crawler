import type { TStatusFE } from "@/types";

export const getStatusColor = (status: TStatusFE) => {
  switch (status) {
    case "대기중":
      return "text-gray-400";
    case "예약완료":
      return "text-blue-400";
    case "작업중":
      return "text-orange-400";
    case "작업완료":
      return "text-green-400";
    case "작업실패":
      return "text-red-400";
  }
};
