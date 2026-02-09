import React from "react";
import { StyleSheet, View } from "react-native";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemAddToWordBankButton } from "./SwipeCardItemAddToWordBankButton";
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
        word={item.word}
        pronunciation={item.pronunciation}
        meaning={item.meaning}
        example={item.example}
        translation={item.translation}
        isDark={isDark}
      />

      {/* Add to Word Bank Button */}
      <SwipeCardItemAddToWordBankButton
        item={item}
        isDark={isDark}
        initialIsSaved={initialIsSaved}
        day={day}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardInfo: {
    height: "70%",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
});
