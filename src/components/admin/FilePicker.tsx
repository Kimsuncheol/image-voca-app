import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FilePickerProps {
  file: any;
  onPick: () => void;
  loading: boolean;
  isDark: boolean;
}

export default function FilePicker({
  file,
  onPick,
  loading,
  isDark,
}: FilePickerProps) {
  const styles = getStyles(isDark);

  return (
    <TouchableOpacity
      style={[styles.uploadButton, file && styles.uploadButtonSelected]}
      onPress={onPick}
      disabled={loading}
    >
      {file ? (
        <>
          <Ionicons name="document-text" size={32} color="#007AFF" />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.fileSize}>
              {(file.size / 1024).toFixed(1)} KB
            </Text>
          </View>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color="#34C759"
            style={styles.checkIcon}
          />
        </>
      ) : (
        <>
          <Ionicons
            name="cloud-upload-outline"
            size={32}
            color={isDark ? "#8e8e93" : "#999"}
          />
          <Text style={styles.uploadButtonText}>Tap to select CSV file</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    uploadButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      minHeight: 200,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
      borderStyle: "dashed",
      backgroundColor: isDark ? "#1c1c1e" : "#f9f9f9",
      gap: 12,
    },
    uploadButtonSelected: {
      borderStyle: "solid",
      borderColor: "#007AFF",
      backgroundColor: isDark ? "#1a2a3a" : "#eef7ff",
    },
    uploadButtonText: {
      color: isDark ? "#8e8e93" : "#999",
      fontSize: 14,
      fontWeight: "500",
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    fileSize: {
      fontSize: 12,
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginTop: 2,
    },
    checkIcon: {
      marginLeft: 8,
    },
  });
