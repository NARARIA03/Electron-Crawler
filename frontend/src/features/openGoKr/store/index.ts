import { create } from "zustand";
import { TQueryItem } from "../types";
import { toast } from "sonner";

type Store = {
  queryItems: TQueryItem[];
  addRow: () => void;
  removeRow: (id: string) => void;
  setQuery: (id: string, newQueries: unknown[] | null) => void;
  setscheduledTime: (id: string, newScheduledTime?: string) => void;
  runQuery: (id: string) => void;
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

  runQuery: (id) => {
    set(({ queryItems }) => {
      const processId = `${id}_${Date.now().toString()}`;

      return {
        queryItems: queryItems.map((queryItem) =>
          queryItem.id === id ? { ...queryItem, status: "작업중", processId } : queryItem
        ),
      };
    });
  },
}));
