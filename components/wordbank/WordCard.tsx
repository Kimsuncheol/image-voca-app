import React from "react";
import { StyleSheet, View } from "react-native";
import { WordCardActions } from "./WordCardActions";
import { WordCardExample } from "./WordCardExample";
import { WordCardHeader } from "./WordCardHeader";
import { WordCardMeaning } from "./WordCardMeaning";

/**
 * SavedWord type definition
 * Represents a word saved to the user's word bank
 */
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

/**
 * Main WordCard component
 * Displays a saved word with all its information in a card format
 * Composed of smaller sub-components for better maintainability
 */
export function WordCard({
  word,
  courseColor,
  isDark,
  onDelete,
}: WordCardProps) {
  return (
    <View
      style={[
        styles.wordCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      {/* Header row with title and actions */}
      <View style={styles.wordTitleRow}>
        <WordCardHeader
          word={word.word}
          day={word.day}
          pronunciation={word.pronunciation}
        />
        <WordCardActions
          word={word.word}
          wordId={word.id}
          courseColor={courseColor}
          onDelete={onDelete}
        />
      </View>

      {/* Meaning section */}
      <WordCardMeaning meaning={word.meaning} />

      {/* Example section */}
      <WordCardExample example={word.example} translation={word.translation} />
    </View>
  );
}

const styles = StyleSheet.create({
  wordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  wordTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
});
