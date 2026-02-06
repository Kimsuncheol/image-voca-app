/**
 * UploadContext - Cross-Screen Data Transfer for Upload Flow
 *
 * This context provides a mechanism for passing data between the upload-item screen
 * and the add-voca screen. When using expo-router navigation, we can't directly return
 * values from a screen, so this context acts as a temporary storage for upload results.
 *
 * Data Flow:
 * 1. User navigates from add-voca → upload-item screen
 * 2. User fills out the form and taps "Add" or "Save"
 * 3. upload-item screen calls setPendingResult() with the form data
 * 4. upload-item screen navigates back via router.back()
 * 5. add-voca screen's useEffect calls consumeResult() to retrieve the data
 * 6. consumeResult() returns the data and clears it (one-time consumption)
 */

import React, { createContext, useCallback, useContext, useState } from "react";
import { CsvUploadItem } from "../components/admin/CsvUploadItemView";
import { SheetUploadItem } from "../components/admin/GoogleSheetUploadItemView";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result object returned from the upload-item screen
 * Contains all necessary information to update the parent screen's state
 */
type UploadResult = {
  type: "csv" | "link"; // Which tab type (CSV file or Google Sheets link)
  mode: "add" | "edit"; // Adding new item or editing existing item
  index: number | null; // Index of item being edited (null for new items)
  item: CsvUploadItem | SheetUploadItem; // The actual form data
} | null;

/**
 * Context interface exposing upload result management
 */
interface UploadContextType {
  pendingResult: UploadResult; // Currently stored result
  setPendingResult: (result: UploadResult) => void; // Store a new result
  consumeResult: () => UploadResult; // Retrieve and clear result
}

// ============================================================================
// Context Creation
// ============================================================================

const UploadContext = createContext<UploadContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * UploadProvider - Wraps the app to enable cross-screen upload data transfer
 *
 * This should be placed high in the component tree (typically in _layout.tsx)
 * to ensure it persists across navigation between screens.
 */
export function UploadProvider({ children }: { children: React.ReactNode }) {
  // State to hold the pending upload result
  const [pendingResult, setPendingResult] = useState<UploadResult>(null);

  /**
   * Consume and clear the pending result
   * This is a one-time read operation - after calling this, the result is cleared
   * to prevent duplicate processing on subsequent renders
   */
  const consumeResult = useCallback(() => {
    const result = pendingResult;
    setPendingResult(null); // Clear after reading
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

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * useUploadContext - Hook to access upload result management
 *
 * Usage in upload-item screen (sender):
 *   const { setPendingResult } = useUploadContext();
 *   setPendingResult({ type: "csv", mode: "add", index: null, item: csvItem });
 *   router.back();
 *
 * Usage in add-voca screen (receiver):
 *   const { consumeResult } = useUploadContext();
 *   useEffect(() => {
 *     const result = consumeResult();
 *     if (result) { // process result }
 *   }, [consumeResult]);
 *
 * @throws Error if used outside of UploadProvider
 */
export function useUploadContext() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUploadContext must be used within an UploadProvider");
  }
  return context;
}
