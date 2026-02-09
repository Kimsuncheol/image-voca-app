import React from "react";
import { StyleSheet, View } from "react-native";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemMeaningExampleSentenceSection } from "./SwipeCardItemMeaningExampleSentenceSection";

interface CardInfoSectionProps {
  item: VocabularyCard;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
}

export function SwipeCardItemCardInfoSection({
  item,
  isDark,
  initialIsSaved = false,
  day,
}: CardInfoSectionProps) {
  return (
    <View
      style={[
        styles.cardInfo,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
      ]}
    >
      {/* Merged Word, Meaning & Example Section */}
      <SwipeCardItemMeaningExampleSentenceSection
        item={item}
        word={item.word}
        pronunciation={item.pronunciation}
        meaning={item.meaning}
        example={item.example}
        translation={item.translation}
        isDark={isDark}
        initialIsSaved={initialIsSaved}
        day={day}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardInfo: {
    height: "65%",
    justifyContent: "flex-start",
    padding: 24,
    backgroundColor: "#fff",
  },
});
