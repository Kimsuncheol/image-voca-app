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
  borderColor,
  fontColor = "#007AFF",
}: AddAnotherButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.addButton, { borderColor }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="add-circle-outline" size={20} color={fontColor} />
      <Text style={[styles.addButtonText, { color: fontColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
