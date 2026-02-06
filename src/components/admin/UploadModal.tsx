import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CsvUploadItem } from "./CsvUploadItemView";
import { SheetUploadItem } from "./GoogleSheetUploadItemView";
import UploadCSVFileView from "./UploadCSVFileView";
import UploadViaLinkView from "./UploadViaLinkView";

type ModalType = "csv" | "link";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  modalType: ModalType;
  isDark: boolean;
  // CSV props
  csvItems: CsvUploadItem[];
  setCsvItems: React.Dispatch<React.SetStateAction<CsvUploadItem[]>>;
  onPickDocument: (itemId: string) => void;
  // Link props
  sheetItems: SheetUploadItem[];
  setSheetItems: React.Dispatch<React.SetStateAction<SheetUploadItem[]>>;
  loading: boolean;
}

export default function UploadModal({
  visible,
  onClose,
  modalType,
  isDark,
  csvItems,
  setCsvItems,
  onPickDocument,
  sheetItems,
  setSheetItems,
  loading,
}: UploadModalProps) {
  const styles = getStyles(isDark);

  const title = modalType === "csv" ? "Upload CSV File" : "Import via Link";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
          >
            <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {modalType === "csv" ? (
            <UploadCSVFileView
              items={csvItems}
              setItems={setCsvItems}
              loading={loading}
              isDark={isDark}
              onPickDocument={onPickDocument}
            />
          ) : (
            <UploadViaLinkView
              items={sheetItems}
              setItems={setSheetItems}
              loading={loading}
              isDark={isDark}
            />
          )}
        </View>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#38383a" : "#e5e5ea",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    closeButton: {
      padding: 4,
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    placeholder: {
      width: 32,
    },
    content: {
      flex: 1,
    },
  });
