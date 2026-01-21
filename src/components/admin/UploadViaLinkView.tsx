import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface UploadViaLinkViewProps {
  sheetId: string;
  setSheetId: (id: string) => void;
  sheetRange: string;
  setSheetRange: (range: string) => void;
  loading: boolean;
  progress: string;
  isDark: boolean;
  token: string | null;
  waitingForToken: boolean;
  onSheetImport: () => void;
}

export default function UploadViaLinkView({
  sheetId,
  setSheetId,
  sheetRange,
  setSheetRange,
  loading,
  progress,
  isDark,
  token,
  waitingForToken,
  onSheetImport,
}: UploadViaLinkViewProps) {
  const styles = getStyles(isDark);

  return (
    <>
      <Text style={styles.sectionTitle}>Import from Google Sheets</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sheet ID</Text>
        <TextInput
          style={styles.input}
          value={sheetId}
          onChangeText={setSheetId}
          placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
          placeholderTextColor={isDark ? "#555" : "#999"}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.pathHint}>
          Copy the ID from your Google Sheet URL
        </Text>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Range (Optional)</Text>
        <TextInput
          style={styles.input}
          value={sheetRange}
          onChangeText={setSheetRange}
          placeholder="Sheet1!A:E"
          placeholderTextColor={isDark ? "#555" : "#999"}
        />
      </View>

      <TouchableOpacity
        style={[styles.importButton, { backgroundColor: "#0F9D58" }]} // Google Sheets Green
        onPress={onSheetImport}
        disabled={loading}
      >
        {loading && waitingForToken ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="grid-outline" size={24} color="#fff" />
            <Text style={styles.importButtonText}>
              {token ? "Import from Sheets" : "Connect & Import Sheets"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {loading && <Text style={styles.progressText}>{progress}</Text>}
    </>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: isDark ? "#8e8e93" : "#6e6e73",
      textTransform: "uppercase",
      marginLeft: 4,
    },
    input: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 15,
      borderRadius: 10,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
    },
    pathHint: {
      fontSize: 12,
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginTop: 6,
      fontStyle: "italic",
    },
    importButton: {
      backgroundColor: "#007AFF",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      marginTop: 16,
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
