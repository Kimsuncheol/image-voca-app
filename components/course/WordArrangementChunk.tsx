import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface WordArrangementChunkProps {
  chunk: string;
  onPress: () => void;
  selected?: boolean;
  complete?: boolean;
  disabled?: boolean;
  style?: any;
}

export function WordArrangementChunk({
  chunk,
  onPress,
  selected,
  complete,
  disabled,
  style,
}: WordArrangementChunkProps) {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chunk,
        { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
        selected && styles.chunkSelected,
        complete && styles.chunkComplete,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <ThemedText style={styles.chunkText}>{chunk}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chunk: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chunkSelected: {
    backgroundColor: "#9B59B620",
    borderColor: "#9B59B6",
  },
  chunkComplete: {
    backgroundColor: "#28a74520",
    borderColor: "#28a745",
  },
  chunkText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
