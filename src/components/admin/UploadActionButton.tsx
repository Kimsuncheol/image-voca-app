import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

interface UploadActionButtonProps {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  text: string;
  iconName: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
}

export default function UploadActionButton({
  onPress,
  loading,
  disabled,
  text,
  iconName,
  backgroundColor = "#007AFF",
}: UploadActionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.mainUploadButton,
        { backgroundColor },
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name={iconName} size={20} color="#fff" />
          <Text style={styles.mainUploadButtonText}>{text}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mainUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  mainUploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
