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
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionDisabled?: boolean;
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
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionDisabled = false,
}: UploadModalProps) {
  const styles = getStyles(isDark);
  const showSecondaryAction = Boolean(secondaryActionLabel && onSecondaryAction);

  const title = modalType === "csv" ? "Upload CSV File" : "Import via Link";
  const actionColor = modalType === "csv" ? "#007AFF" : "#0F9D58";

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

        <View style={styles.footer}>
          {showSecondaryAction ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (loading || secondaryActionDisabled) &&
                    styles.secondaryButtonDisabled,
                ]}
                onPress={onSecondaryAction}
                disabled={loading || secondaryActionDisabled}
              >
                <Text style={styles.secondaryButtonText}>
                  {secondaryActionLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.rowButton,
                  { backgroundColor: actionColor },
                  (loading || primaryActionDisabled) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={onPrimaryAction}
                disabled={loading || primaryActionDisabled}
              >
                <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: actionColor },
                (loading || primaryActionDisabled) && styles.primaryButtonDisabled,
              ]}
              onPress={onPrimaryAction}
              disabled={loading || primaryActionDisabled}
            >
              <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
            </TouchableOpacity>
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
      marginBottom: 16,
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
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#38383a" : "#e5e5ea",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    primaryButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    rowButton: {
      flex: 1,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "#48484a" : "#d1d1d6",
      backgroundColor: isDark ? "#2c2c2e" : "#fff",
    },
    secondaryButtonDisabled: {
      opacity: 0.6,
    },
    secondaryButtonText: {
      color: isDark ? "#fff" : "#1c1c1e",
      fontSize: 16,
      fontWeight: "600",
    },
  });
