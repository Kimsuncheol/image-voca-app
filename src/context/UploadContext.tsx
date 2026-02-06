import React, { createContext, useCallback, useContext, useState } from "react";
import { CsvUploadItem } from "../components/admin/CsvUploadItemView";
import { SheetUploadItem } from "../components/admin/GoogleSheetUploadItemView";

type UploadResult = {
  type: "csv" | "link";
  mode: "add" | "edit";
  index: number | null;
  item: CsvUploadItem | SheetUploadItem;
} | null;

interface UploadContextType {
  pendingResult: UploadResult;
  setPendingResult: (result: UploadResult) => void;
  consumeResult: () => UploadResult;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [pendingResult, setPendingResult] = useState<UploadResult>(null);

  const consumeResult = useCallback(() => {
    const result = pendingResult;
    setPendingResult(null);
    return result;
  }, [pendingResult]);

  return (
    <UploadContext.Provider
      value={{ pendingResult, setPendingResult, consumeResult }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUploadContext must be used within an UploadProvider");
  }
  return context;
}
