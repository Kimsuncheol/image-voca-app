import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface WordCardActionsProps {
  word: string;
  wordId: string;
  courseColor?: string;
  onDelete: (wordId: string) => void;
}

/**
 * Action buttons for the word card
 * Includes text-to-speech and delete functionality
 */
export function WordCardActions({
  word,
  wordId,
  courseColor,
  onDelete,
}: WordCardActionsProps) {
  const speak = (text: string) => {
    Speech.speak(text);
  };

  return (
    <View style={styles.actionButtons}>
      {/* Text-to-speech button */}
      <TouchableOpacity
        onPress={() => speak(word)}
        style={styles.speakerButton}
      >
        <Ionicons
          name="volume-medium"
          size={22}
          color={courseColor || "#007AFF"}
        />
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity
        onPress={() => onDelete(wordId)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  speakerButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
});
