/**
 * Upload Item Screen
 *
 * A modal-style screen (replaced the previous UploadModal component) for adding or editing
 * vocabulary upload items. Supports two upload methods:
 * 1. CSV File Upload - User selects a CSV file from device
 * 2. Google Sheets Link - User provides a Sheet ID and range
 *
 * Navigation:
 * - Presented as a modal (slides up from bottom)
 * - Called from add-voca.tsx via router.push()
 * - Returns data via UploadContext when user taps "Add" or "Save"
 *
 * Features:
 * - Auto-extracts day number from CSV filename (e.g., "Day 5.csv" → "5")
 * - Validates required fields before allowing submission
 * - Separate validation logic for CSV (requires file + day) vs Link (requires sheetId + day)
 * - Dark mode support
 */

// ============================================================================
// Imports
// ============================================================================

// Expo & React Native
import * as DocumentPicker from "expo-document-picker"; // For CSV file selection
import { Stack, useLocalSearchParams, useRouter } from "expo-router"; // Navigation
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Components
import { CsvUploadItem } from "../../src/components/admin/CsvUploadItemView";
import { SheetUploadItem } from "../../src/components/admin/GoogleSheetUploadItemView";
import UploadCSVFileView from "../../src/components/admin/UploadCSVFileView";
import UploadModalHeader from "../../src/components/admin/UploadModalHeader";
import UploadModalPrimaryAction from "../../src/components/admin/UploadModalPrimaryAction";
import UploadViaLinkView from "../../src/components/admin/UploadViaLinkView";

// Context & Hooks
import { useTheme } from "../../src/context/ThemeContext";
import { useUploadContext } from "../../src/context/UploadContext";

// ============================================================================
// Type Definitions
// ============================================================================

type ModalType = "csv" | "link";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract day number from CSV filename
 *
 * Supports various filename patterns:
 * - "Day 5.csv" → "5"
 * - "day_05.csv" → "5"
 * - "DAY-10.csv" → "10"
 * - "vocabulary_day_3.csv" → "3"
 *
 * @param fileName - The CSV filename to parse
 * @returns Day number as string, or null if not found
 */
const extractDayFromFileName = (fileName: string): string | null => {
  const match = fileName
    .toUpperCase()
    .match(/(?:^|[^A-Z0-9])DAY[\s_-]*0*([1-9]\d*)(?!\d)/);

  return match ? match[1] : null;
};

// ============================================================================
// Main Component
// ============================================================================

export default function UploadItemScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const router = useRouter();
  const { setPendingResult } = useUploadContext();
  const params = useLocalSearchParams<{
    type: ModalType;
    mode: "add" | "edit";
    index?: string;
    csvItem?: string;
    sheetItem?: string;
  }>();

  const modalType = params.type || "csv";
  const isEditMode = params.mode === "edit";
  const editingIndex = params.index ? parseInt(params.index, 10) : null;

  // Parse initial items from params
  const initialCsvItem: CsvUploadItem = params.csvItem
    ? JSON.parse(params.csvItem)
    : {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        day: "",
        file: null,
      };

  const initialSheetItem: SheetUploadItem = params.sheetItem
    ? JSON.parse(params.sheetItem)
    : {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        day: "",
        sheetId: "",
        range: "Sheet1!A:E",
      };

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  // Local form state for CSV and Google Sheets items
  const [csvItem, setCsvItem] = useState<CsvUploadItem>(initialCsvItem);
  const [sheetItem, setSheetItem] = useState<SheetUploadItem>(initialSheetItem);

  // Loading state is managed by the parent screen (add-voca.tsx)
  // This screen is only for form input, actual upload happens in parent
  const loading = false;

  // ---------------------------------------------------------------------------
  // UI Configuration
  // ---------------------------------------------------------------------------

  // Header title changes based on upload method
  const title = modalType === "csv" ? "Upload CSV File" : "Import via Link";

  // Primary action button color (blue for CSV, green for Google Sheets)
  const actionColor = modalType === "csv" ? "#007AFF" : "#0F9D58";

  // ---------------------------------------------------------------------------
  // Event Handlers - File Picker
  // ---------------------------------------------------------------------------

  /**
   * Handle CSV file selection via native document picker
   *
   * Features:
   * - Filters for CSV file types only
   * - Copies file to cache directory for processing
   * - Auto-extracts day number from filename if present
   * - Updates csvItem state with selected file and extracted day
   */
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true, // Required for FileSystem.readAsStringAsync later
      });

      // User cancelled picker
      if (result.canceled) return;

      const file = result.assets[0];

      // Try to extract day number from filename (e.g., "Day 5.csv" → "5")
      const extractedDay = extractDayFromFileName(file.name || "");

      // Update CSV item with selected file and auto-filled day (if found)
      setCsvItem((prev) => ({
        ...prev,
        file,
        day: extractedDay ?? prev.day, // Use extracted day or keep existing
      }));

      console.log("[Picker] File selected:", file.name);
      if (extractedDay) {
        console.log("[Picker] Extracted day from filename:", extractedDay);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Validation Logic
  // ---------------------------------------------------------------------------

  /**
   * CSV item is valid when:
   * - Day field is not empty
   * - File has been selected
   */
  const isCsvValid = Boolean(csvItem.day.trim() && csvItem.file);

  /**
   * Google Sheets item is valid when:
   * - Day field is not empty
   * - Sheet ID is not empty
   * (Range has a default value so not validated)
   */
  const isSheetValid = Boolean(
    sheetItem.day.trim() && sheetItem.sheetId.trim(),
  );

  // Overall validity depends on current tab
  const isValid = modalType === "csv" ? isCsvValid : isSheetValid;

  // ---------------------------------------------------------------------------
  // Event Handlers - Primary Action (Add/Save)
  // ---------------------------------------------------------------------------

  /**
   * Handle "Add CSV Item" / "Add Link Item" / "Save Changes" button press
   *
   * Flow:
   * 1. Validate form data
   * 2. If valid, store result in UploadContext
   * 3. Navigate back to parent screen
   * 4. Parent screen's useEffect will consume the result and update its state
   *
   * This pattern is necessary because expo-router doesn't support direct
   * return values from screens (unlike traditional React Navigation modals)
   */
  const handlePrimaryAction = () => {
    if (modalType === "csv") {
      // CSV validation
      if (!isCsvValid) {
        Alert.alert(
          "Validation Error",
          "Please ensure the item has a Day and a File selected.",
        );
        return;
      }

      // Store result in context for parent screen to consume
      setPendingResult({
        type: "csv",
        mode: isEditMode ? "edit" : "add",
        index: editingIndex,
        item: csvItem,
      });

      // Navigate back - parent's useEffect will trigger and consume the result
      router.back();
    } else {
      // Google Sheets validation
      if (!isSheetValid) {
        Alert.alert(
          "Validation Error",
          "Please ensure the item has a Day and a Sheet ID.",
        );
        return;
      }

      // Store result in context for parent screen to consume
      setPendingResult({
        type: "link",
        mode: isEditMode ? "edit" : "add",
        index: editingIndex,
        item: sheetItem,
      });

      // Navigate back - parent's useEffect will trigger and consume the result
      router.back();
    }
  };

  // ---------------------------------------------------------------------------
  // Event Handlers - Close
  // ---------------------------------------------------------------------------

  /**
   * Handle close button (X) press
   * Simply navigates back without saving any changes
   */
  const handleClose = () => {
    router.back();
  };

  // ---------------------------------------------------------------------------
  // UI Labels
  // ---------------------------------------------------------------------------

  /**
   * Primary action button label changes based on mode:
   * - Edit mode: "Save Changes"
   * - Add mode (CSV): "Add CSV Item"
   * - Add mode (Link): "Add Link Item"
   */
  const primaryActionLabel = isEditMode
    ? "Save Changes"
    : modalType === "csv"
      ? "Add CSV Item"
      : "Add Link Item";

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      {/* Configure this screen as a modal presentation */}
      <Stack.Screen
        options={{
          headerShown: false, // Hide default header (using custom UploadModalHeader)
          presentation: "modal", // Present as modal (slides up from bottom)
          animation: "slide_from_bottom", // Slide up animation
        }}
      />

      {/* Header Section - Close button and title */}
      <UploadModalHeader
        isDark={isDark}
        title={title}
        onClose={handleClose}
        loading={loading}
      />

      {/* Content Section - Form inputs (CSV or Google Sheets) */}
      <View style={styles.content}>
        {modalType === "csv" ? (
          // CSV upload form: Day input + File picker button
          <UploadCSVFileView
            item={csvItem}
            setItem={setCsvItem}
            loading={loading}
            isDark={isDark}
            onPickDocument={handlePickDocument}
          />
        ) : (
          // Google Sheets form: Day input + Sheet ID + Range
          <UploadViaLinkView
            item={sheetItem}
            setItem={setSheetItem}
            loading={loading}
            isDark={isDark}
          />
        )}
      </View>

      {/* Footer Section - Primary action button */}
      <UploadModalPrimaryAction
        isDark={isDark}
        label={primaryActionLabel}
        actionColor={actionColor}
        onPress={handlePrimaryAction}
        loading={loading}
        disabled={isEditMode ? loading : loading || !isValid}
        // Disabled when:
        // - In add mode: loading OR form is invalid
        // - In edit mode: only when loading
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Dynamic styles based on theme
 * - container: Full screen with theme-appropriate background
 * - content: Flexible container that fills available space
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
    content: {
      flex: 1,
    },
  });
