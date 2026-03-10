import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import { VocabularyCard } from "../../src/types/vocabulary";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";
import { SwipeCardItemAddToWordBankButton } from "./SwipeCardItemAddToWordBankButton";

interface SwipeCardItemWordMeaningSectionProps {
  item: VocabularyCard;
  word: string;
  pronunciation?: string;
  meaning: string;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
}

export function SwipeCardItemWordMeaningSection({
  item,
  word,
  pronunciation,
  meaning,
  isDark,
  initialIsSaved = false,
  day,
}: SwipeCardItemWordMeaningSectionProps) {
  const { speak: speakText } = useSpeech();
  const normalizedPronunciation = pronunciation?.trim();

  const speak = () => {
    speakText(word, {
      language: "en-US",
      rate: 0.9,
    });
  };

  return (
    <>
      {/* Word & Meaning Section */}
      <View style={styles.titleContainer}>
        <View style={styles.leftRow}>
          {/* Word */}
          <TouchableOpacity onPress={speak}>
            <Text
              style={[styles.cardTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
              numberOfLines={1}
            >
              {word}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addButtonContainer}>
          <SwipeCardItemAddToWordBankButton
            item={item}
            isDark={isDark}
            initialIsSaved={initialIsSaved}
            day={day}
          />
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
    alignItems: "center",
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  addButtonContainer: {
    marginLeft: "auto",
    paddingLeft: 12,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    flexShrink: 1,
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
