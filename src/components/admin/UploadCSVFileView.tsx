import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

interface UploadCSVFileViewProps {
  selectedFile: any;
  loading: boolean;
  progress: string;
  isDark: boolean;
  onPickDocument: () => void;
  onUpload: () => void;
}

export default function UploadCSVFileView({
  selectedFile,
  loading,
  progress,
  isDark,
  onPickDocument,
  onUpload,
}: UploadCSVFileViewProps) {
  const styles = getStyles(isDark);

  return (
    <>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={onPickDocument}
        disabled={loading}
      >
        <>
          <Ionicons name="document-attach-outline" size={32} color="#007AFF" />
          <Text style={styles.uploadButtonText}>
            {selectedFile ? selectedFile.name : "Select CSV File"}
          </Text>
        </>
      </TouchableOpacity>

      {selectedFile && (
        <TouchableOpacity
          style={[styles.uploadButton, styles.uploadButtonPrimary]}
          onPress={onUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color="#fff" />
              <Text
                style={[
                  styles.uploadButtonText,
                  styles.uploadButtonTextPrimary,
                ]}
              >
                Upload CSV
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {loading && <Text style={styles.progressText}>{progress}</Text>}
    </>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    uploadButton: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#007AFF",
      borderStyle: "dashed",
      marginBottom: 16,
    },
    uploadButtonText: {
      color: "#007AFF",
      fontSize: 18,
      fontWeight: "600",
      marginTop: 12,
    },
    uploadButtonPrimary: {
      backgroundColor: "#007AFF",
      borderStyle: "solid",
    },
    uploadButtonTextPrimary: {
      color: "#fff",
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#38383a" : "#e5e5ea",
      marginVertical: 24,
    },
    importButton: {
      backgroundColor: "#007AFF",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 48,
    },
    importButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    progressText: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
      color: isDark ? "#ccc" : "#666",
    },
  });
