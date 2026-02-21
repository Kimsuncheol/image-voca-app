import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface UploadProgressModalProps {
  visible: boolean;
  progress: string;
  isDark: boolean;
}

export default function UploadProgressModal({
  visible,
  progress,
  isDark,
}: UploadProgressModalProps) {
  const styles = getStyles(isDark);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.modalTitle}>Uploading...</Text>
          {progress ? (
            <Text style={styles.modalMessage}>{progress}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 24,
      minWidth: 280,
      maxWidth: "80%",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    modalMessage: {
      fontSize: 14,
      color: isDark ? "#a0a0a0" : "#666",
      textAlign: "center",
      lineHeight: 20,
    },
  });
