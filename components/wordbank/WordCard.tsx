import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import { speakWordVariants } from "../../src/utils/wordVariants";
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
  showPronunciation?: boolean;
  expandExampleToContent?: boolean;
  isDeleteMode?: boolean;
  isSelected?: boolean;
  onStartDeleteMode?: (wordId: string) => void;
  onToggleSelection?: (wordId: string) => void;
}

/**
 * Main WordCard component
 * Displays a saved word with all its information in a card format
 * Composed of smaller sub-components for better maintainability
 */
export function WordCard({
  word,
  isDark,
  showPronunciation = true,
  expandExampleToContent = false,
  isDeleteMode = false,
  isSelected = false,
  onStartDeleteMode,
  onToggleSelection,
}: WordCardProps) {
  const { speak } = useSpeech();

  const handleSpeakWord = React.useCallback(async () => {
    if (isDeleteMode) {
      return;
    }

    try {
      await speakWordVariants(word.word, speak);
    } catch (error) {
      console.error("Word card TTS error:", error);
    }
  }, [isDeleteMode, speak, word.word]);

  const handleStartDeleteMode = React.useCallback(() => {
    onStartDeleteMode?.(word.id);
  }, [onStartDeleteMode, word.id]);

  const handleToggleSelection = React.useCallback(() => {
    onToggleSelection?.(word.id);
  }, [onToggleSelection, word.id]);

  return (
    <Pressable
      testID={`word-card-${word.id}`}
      style={[
        styles.wordCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        isDeleteMode &&
          (isDark ? styles.wordCardDeleteModeDark : styles.wordCardDeleteModeLight),
        isSelected && (isDark ? styles.wordCardSelectedDark : styles.wordCardSelectedLight),
      ]}
      onPress={isDeleteMode ? handleToggleSelection : undefined}
      onLongPress={handleStartDeleteMode}
      accessibilityState={isDeleteMode ? { selected: isSelected } : undefined}
    >
      <View pointerEvents={isDeleteMode ? "none" : "auto"}>
        {/* Header row with title and actions */}
        <View style={styles.wordTitleRow}>
          <WordCardHeader
            word={word.word}
            day={word.day}
            pronunciation={showPronunciation ? word.pronunciation : undefined}
            onSpeak={handleSpeakWord}
            onLongPress={handleStartDeleteMode}
          />
        </View>

        {/* Meaning section */}
        <WordCardMeaning meaning={word.meaning} isDark={isDark} />

        <WordCardExample
          example={word.example}
          translation={word.translation}
          expandToContent={expandExampleToContent}
        />
      </View>

      {isDeleteMode ? (
        <View
          style={[
            styles.selectionBadge,
            isSelected
              ? styles.selectionBadgeSelected
              : isDark
                ? styles.selectionBadgeIdleDark
                : styles.selectionBadgeIdleLight,
          ]}
        >
          <Ionicons
            name={isSelected ? "checkmark" : "ellipse-outline"}
            size={16}
            color={isSelected ? "#fff" : isDark ? "#fff" : "#666"}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    position: "relative",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  wordTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  wordCardDeleteModeLight: {
    borderColor: "#d0d0d0",
  },
  wordCardDeleteModeDark: {
    borderColor: "#3a3a3c",
  },
  wordCardSelectedLight: {
    borderColor: "#007AFF",
    backgroundColor: "#EAF3FF",
  },
  wordCardSelectedDark: {
    borderColor: "#0A84FF",
    backgroundColor: "#152333",
  },
  selectionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  selectionBadgeSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  selectionBadgeIdleLight: {
    backgroundColor: "#fff",
    borderColor: "#c7c7cc",
  },
  selectionBadgeIdleDark: {
    backgroundColor: "#2c2c2e",
    borderColor: "#636366",
  },
});
