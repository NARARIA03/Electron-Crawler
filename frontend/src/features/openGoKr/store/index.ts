import { create } from "zustand";
import { TQueryItem } from "../types";
import { toast } from "sonner";

type Store = {
  queryItems: TQueryItem[];
  addRow: () => void;
  removeRow: (id: string) => void;
  setQuery: (id: string, newQuery: TQueryItem["query"]) => void;
  setscheduledTime: (id: string, newScheduledTime: TQueryItem["scheduledTime"]) => void;
  setStatus: (id: string, newStatus: TQueryItem["status"]) => void;
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

  setQuery: (id, newQuery) => {
    set(({ queryItems }) => {
      return {
        queryItems: queryItems.map((queryItem) =>
          queryItem.id === id ? { ...queryItem, query: newQuery } : queryItem
        ),
      };
    });
  },

  setscheduledTime: (id, newScheduledTime) => {
    set(({ queryItems }) => {
      return {
        queryItems: queryItems.map((queryItem) =>
          queryItem.id === id ? { ...queryItem, scheduledTime: newScheduledTime } : queryItem
        ),
      };
    });
  },

  setStatus: (id, newStatus) => {
    set(({ queryItems }) => {
      return {
        queryItems: queryItems.map((queryItem) =>
          queryItem.id === id ? { ...queryItem, status: newStatus } : queryItem
        ),
      };
    });
  },
}));
