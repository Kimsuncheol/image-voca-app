import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CsvUploadItem } from "../../src/components/admin/CsvUploadItemView";
import { SheetUploadItem } from "../../src/components/admin/GoogleSheetUploadItemView";
import UploadCSVFileView from "../../src/components/admin/UploadCSVFileView";
import UploadModalHeader from "../../src/components/admin/UploadModalHeader";
import UploadModalPrimaryAction from "../../src/components/admin/UploadModalPrimaryAction";
import UploadViaLinkView from "../../src/components/admin/UploadViaLinkView";
import { useTheme } from "../../src/context/ThemeContext";
import { useUploadContext } from "../../src/context/UploadContext";

type ModalType = "csv" | "link";

const extractDayFromFileName = (fileName: string): string | null => {
  const match = fileName
    .toUpperCase()
    .match(/(?:^|[^A-Z0-9])DAY[\s_-]*0*([1-9]\d*)(?!\d)/);

  return match ? match[1] : null;
};

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

  const [csvItem, setCsvItem] = useState<CsvUploadItem>(initialCsvItem);
  const [sheetItem, setSheetItem] = useState<SheetUploadItem>(initialSheetItem);
  const loading = false; // Loading is managed by parent screen

  const title = modalType === "csv" ? "Upload CSV File" : "Import via Link";
  const actionColor = modalType === "csv" ? "#007AFF" : "#0F9D58";

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const extractedDay = extractDayFromFileName(file.name || "");
      setCsvItem((prev) => ({
        ...prev,
        file,
        day: extractedDay ?? prev.day,
      }));
      console.log("[Picker] File selected:", file.name);
      if (extractedDay) {
        console.log("[Picker] Extracted day from filename:", extractedDay);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const isCsvValid = Boolean(csvItem.day.trim() && csvItem.file);
  const isSheetValid = Boolean(
    sheetItem.day.trim() && sheetItem.sheetId.trim(),
  );
  const isValid = modalType === "csv" ? isCsvValid : isSheetValid;

  const handlePrimaryAction = () => {
    if (modalType === "csv") {
      if (!isCsvValid) {
        Alert.alert(
          "Validation Error",
          "Please ensure the item has a Day and a File selected.",
        );
        return;
      }
      // Set result via context and navigate back
      setPendingResult({
        type: "csv",
        mode: isEditMode ? "edit" : "add",
        index: editingIndex,
        item: csvItem,
      });
      router.back();
    } else {
      if (!isSheetValid) {
        Alert.alert(
          "Validation Error",
          "Please ensure the item has a Day and a Sheet ID.",
        );
        return;
      }
      // Set result via context and navigate back
      setPendingResult({
        type: "link",
        mode: isEditMode ? "edit" : "add",
        index: editingIndex,
        item: sheetItem,
      });
      router.back();
    }
  };

  const handleClose = () => {
    router.back();
  };

  const primaryActionLabel = isEditMode
    ? "Save Changes"
    : modalType === "csv"
      ? "Add CSV Item"
      : "Add Link Item";

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <UploadModalHeader
        isDark={isDark}
        title={title}
        onClose={handleClose}
        loading={loading}
      />

      {/* Content */}
      <View style={styles.content}>
        {modalType === "csv" ? (
          <UploadCSVFileView
            item={csvItem}
            setItem={setCsvItem}
            loading={loading}
            isDark={isDark}
            onPickDocument={handlePickDocument}
          />
        ) : (
          <UploadViaLinkView
            item={sheetItem}
            setItem={setSheetItem}
            loading={loading}
            isDark={isDark}
          />
        )}
      </View>

      <UploadModalPrimaryAction
        isDark={isDark}
        label={primaryActionLabel}
        actionColor={actionColor}
        onPress={handlePrimaryAction}
        loading={loading}
        disabled={isEditMode ? loading : loading || !isValid}
      />
    </SafeAreaView>
  );
}

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
