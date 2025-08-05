import { create } from "zustand";
import { TQueryItem } from "../types";
import { toast } from "sonner";

type Store = {
  queryItems: TQueryItem[];
  addRow: () => void;
  removeRow: (id: string) => void;
  setQuery: (id: string, query: TQueryItem["query"]) => void;
  setscheduledTime: (id: string, scheduledTime: TQueryItem["scheduledTime"]) => void;
  setStatus: (id: string, status: TQueryItem["status"]) => void;
};

const getNewQueryItem = (): TQueryItem => {
  const id = Date.now().toString();
  return {
    id,
    query: null,
    scheduledTime: undefined,
    status: "대기중",
    log: "",
  };
};

export const useOpenGoKrStore = create<Store>()((set) => ({
  queryItems: [getNewQueryItem()],

  addRow: () => {
    set(({ queryItems }) => {
      return { queryItems: [...queryItems, getNewQueryItem()] };
    });
  },

  removeRow: (id) => {
    set(({ queryItems }) => {
      if (queryItems.length === 1) {
        toast.error("최소 한 개의 행은 유지되어야 합니다.");
        return { queryItems };
      }

      const status = queryItems.find((queryItem) => queryItem.id === id)?.status;
      if (status === "작업중") {
        toast.error("작업중인 쿼리는 삭제할 수 없습니다.");
        return { queryItems };
      }

      return { queryItems: queryItems.filter((queryItem) => queryItem.id !== id) };
    });
  },

  setQuery: (id, query) => {
    set(({ queryItems }) => {
      return {
        queryItems: queryItems.map((queryItem) => (queryItem.id === id ? { ...queryItem, query } : queryItem)),
      };
    });
  },

  setscheduledTime: (id, scheduledTime) => {
    set(({ queryItems }) => {
      return {
        queryItems: queryItems.map((queryItem) => (queryItem.id === id ? { ...queryItem, scheduledTime } : queryItem)),
      };
    });
  },

  setStatus: (id, status) => {
    set(({ queryItems }) => {
      return {
        queryItems: queryItems.map((queryItem) => (queryItem.id === id ? { ...queryItem, status } : queryItem)),
      };
    });
  },
}));
