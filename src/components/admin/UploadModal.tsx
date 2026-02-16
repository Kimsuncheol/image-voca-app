import React from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CsvUploadItem } from "./CsvUploadItemView";
import { SheetUploadItem } from "./GoogleSheetUploadItemView";
import UploadCSVFileView from "./UploadCSVFileView";
import UploadModalHeader from "./UploadModalHeader";
import UploadModalPrimaryAction from "./UploadModalPrimaryAction";
import UploadViaLinkView from "./UploadViaLinkView";

type ModalType = "csv" | "link";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  modalType: ModalType;
  isDark: boolean;
  // CSV props
  csvItem: CsvUploadItem;
  setCsvItem: React.Dispatch<React.SetStateAction<CsvUploadItem>>;
  onPickDocument: () => void;
  // Link props
  sheetItem: SheetUploadItem;
  setSheetItem: React.Dispatch<React.SetStateAction<SheetUploadItem>>;
  loading: boolean;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionDisabled: boolean;
}

export default function UploadModal({
  visible,
  onClose,
  modalType,
  isDark,
  csvItem,
  setCsvItem,
  onPickDocument,
  sheetItem,
  setSheetItem,
  loading,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled,
}: UploadModalProps) {
  const styles = getStyles(isDark);

  const title = modalType === "csv" ? "Upload CSV File" : "Import via Link";
  const actionColor = modalType === "csv" ? "#007AFF" : "#0F9D58";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <UploadModalHeader
          isDark={isDark}
          title={title}
          onClose={onClose}
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
              onPickDocument={onPickDocument}
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
          onPress={onPrimaryAction}
          loading={loading}
          disabled={primaryActionDisabled}
        />
      </SafeAreaView>
    </Modal>
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
