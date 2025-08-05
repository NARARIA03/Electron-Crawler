import { useEffect } from "react";
import { useOpenGoKrStore } from "../store";
import { TQueryItem } from "../types";

type Params = Pick<TQueryItem, "id" | "status">;

export const useSyncIpcToZustand = () => {
  const { queryItems, setStatus } = useOpenGoKrStore();

  useEffect(() => {
    const handleStatusUpdate = (_: unknown, { id, status }: Params) => {
      setStatus(id, status);
    };

    window.ipcRenderer.on("openGoKr:updateStatus", handleStatusUpdate);

    return () => {
      window.ipcRenderer.off("openGoKr:updateStatus", handleStatusUpdate);
    };
  }, [queryItems, setStatus]);
};
