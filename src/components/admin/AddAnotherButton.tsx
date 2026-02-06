import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface AddAnotherButtonProps {
  onPress: () => void;
  disabled: boolean;
  text: string;
  borderColor?: string;
  fontColor?: string;
}

export default function AddAnotherButton({
  onPress,
  disabled,
  text,
  borderColor = "#007AFF",
  fontColor = "#007AFF",
}: AddAnotherButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.addButton, { borderColor }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="add-circle-outline" size={16} color={fontColor} />
      <Text style={[styles.addButtonText, { color: fontColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
