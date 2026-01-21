import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  translation?: string;
  pronunciation: string;
  example: string;
  course: string;
  day?: number;
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
          <View style={styles.wordTitleContainer}>
            <ThemedText type="subtitle" style={styles.wordTitle}>
              {word.word}
            </ThemedText>
            {word.day && (
              <ThemedText style={styles.dayBadge}>Day {word.day}</ThemedText>
            )}
          </View>
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
        {word.translation && (
          <ThemedText style={styles.translation}>{word.translation}</ThemedText>
        )}
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
  wordTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  wordTitle: {
    fontSize: 22,
  },
  dayBadge: {
    fontSize: 13,
    opacity: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
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
  translation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
    fontStyle: "italic",
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
