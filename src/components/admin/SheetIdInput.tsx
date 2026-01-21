import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface SheetIdInputProps {
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  isDark: boolean;
}

export default function SheetIdInput({
  value,
  onChangeText,
  editable,
  isDark,
}: SheetIdInputProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Sheet ID</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="e.g. 1BxiMVs..."
        placeholderTextColor={isDark ? "#555" : "#999"}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
      />
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    inputGroup: {
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
      color: isDark ? "#8e8e93" : "#6e6e73",
      textTransform: "uppercase",
      marginLeft: 2,
    },
    input: {
      backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
      padding: 12,
      borderRadius: 8,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
    },
  });
