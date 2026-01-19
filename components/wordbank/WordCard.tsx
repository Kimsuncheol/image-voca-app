import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  course: string;
  addedAt: string;
}

interface WordCardProps {
  word: SavedWord;
  courseColor?: string;
  isDark: boolean;
  onDelete: (wordId: string) => void;
}

export function WordCard({
  word,
  courseColor,
  isDark,
  onDelete,
}: WordCardProps) {
  const speak = (text: string) => {
    Speech.speak(text);
  };

  return (
    <View
      style={[
        styles.wordCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <View style={styles.wordHeader}>
        <View style={styles.wordTitleRow}>
          <ThemedText type="subtitle" style={styles.wordTitle}>
            {word.word}
          </ThemedText>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => speak(word.word)}
              style={styles.speakerButton}
            >
              <Ionicons
                name="volume-medium"
                size={22}
                color={courseColor || "#007AFF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(word.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        {word.pronunciation && (
          <ThemedText style={styles.pronunciation}>
            {word.pronunciation}
          </ThemedText>
        )}
      </View>
      <ThemedText style={styles.meaning}>{word.meaning}</ThemedText>
      <View style={styles.exampleContainer}>
        <ThemedText style={styles.example}>{`"${word.example}"`}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  wordHeader: {
    marginBottom: 8,
  },
  wordTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wordTitle: {
    fontSize: 22,
    flex: 1,
  },
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
  pronunciation: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.6,
    marginTop: 2,
  },
  meaning: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  exampleContainer: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    marginTop: 4,
  },
  example: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
  },
});
