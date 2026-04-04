import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
import { VocabularyCard } from "../../src/types/vocabulary";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";

interface SwipeCardItemWordMeaningSectionProps {
  item: VocabularyCard;
  word: string;
  pronunciation?: string;
  meaning: string;
  isDark: boolean;
  isActive?: boolean;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

const parseWordVariants = (value: string): string[] =>
  value
    .split("=")
    .map((segment) => segment.trim())
    .filter(Boolean);

export function SwipeCardItemWordMeaningSection({
  item,
  word,
  pronunciation,
  meaning,
  isDark,
  isActive = true,
  initialIsSaved = false,
  day,
  onSavedWordChange,
}: SwipeCardItemWordMeaningSectionProps) {
  useCardSpeechCleanup(isActive);
  const { speak: speakText } = useSpeech();
  const normalizedPronunciation = pronunciation?.trim();
  const wordVariants = React.useMemo(() => parseWordVariants(word), [word]);
  const isMultiVariantWord = wordVariants.length > 1;

  const speak = React.useCallback(async () => {
    if (!isActive) {
      return;
    }

    await speakWordVariants(word, speakText, {
      language: "en-US",
      rate: 0.9,
    });
  }, [isActive, speakText, word]);

  const handlePressWord = React.useCallback(() => {
    void speak();
  }, [speak]);

  const renderWord = () => {
    if (!isMultiVariantWord) {
      return (
        <Text
          style={[styles.cardTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
          numberOfLines={1}
        >
          {wordVariants[0] ?? word}
        </Text>
      );
    }

    return (
      <View style={styles.wordVariantsContainer}>
        {wordVariants.map((variant, index) => (
          <Text
            key={`${variant}-${index}`}
            style={[
              styles.cardTitle,
              styles.cardTitleVariant,
              { color: isDark ? "#fff" : "#1a1a1a" },
            ]}
          >
            {variant}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <>
      {/* Word & Meaning Section */}
      <View style={styles.titleContainer}>
        <View style={styles.leftRow}>
          {/* Word */}
          <TouchableOpacity onPress={handlePressWord} activeOpacity={0.7}>
            {renderWord()}
          </TouchableOpacity>
        </View>
      </View>
      {normalizedPronunciation ? (
        <Text
          style={[styles.cardSubtitle, { color: isDark ? "#999" : "#666" }]}
        >
          {normalizedPronunciation}
        </Text>
      ) : null}
      <View style={styles.meaningSection}>
        <InlineMeaningWithChips
          meaning={meaning}
          isDark={isDark}
          textStyle={[
            styles.cardDescription,
            { color: isDark ? "#e0e0e0" : "#2c2c2c" },
          ]}
          containerStyle={styles.inlineMeaning}
          chipStyle={styles.inlineChip}
          testID="inline-meaning"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    flexShrink: 1,
  },
  wordVariantsContainer: {
    gap: 4,
  },
  cardTitleVariant: {
    lineHeight: 38,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  meaningSection: {
    marginBottom: 8,
  },
  inlineMeaning: {
    gap: 4,
  },
  inlineChip: {
    marginRight: 6,
  },
  cardDescription: {
    fontSize: 17,
    color: "#2c2c2c",
    lineHeight: 24,
    fontWeight: "500",
  },
});
