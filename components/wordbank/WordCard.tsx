import React from "react";
import { StyleSheet, View } from "react-native";
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
}: WordCardProps) {
  const { speak } = useSpeech();

  const handleSpeakWord = React.useCallback(async () => {
    try {
      await speakWordVariants(word.word, speak);
    } catch (error) {
      console.error("Word card TTS error:", error);
    }
  }, [speak, word.word]);

  return (
    <View
      testID={`word-card-${word.id}`}
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
          pronunciation={showPronunciation ? word.pronunciation : undefined}
          onSpeak={handleSpeakWord}
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
});
