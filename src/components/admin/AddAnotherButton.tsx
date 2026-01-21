import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface AddAnotherButtonProps {
  onPress: () => void;
  disabled: boolean;
  text: string;
}

export default function AddAnotherButton({
  onPress,
  disabled,
  text,
}: AddAnotherButtonProps) {
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
      <Text style={styles.addButtonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
