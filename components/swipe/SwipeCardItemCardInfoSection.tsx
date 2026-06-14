import React from "react";
import { StyleSheet, View } from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import type { ReviewMaskTarget } from "../../src/services/speechPreferences";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemMeaningExampleSentenceSection } from "./SwipeCardItemMeaningExampleSentenceSection";

interface CardInfoSectionProps {
  item: VocabularyCard;
  word: string;
  pronunciation?: string;
  localizedPronunciation?: string;
  meaning: string;
  example: string;
  translation?: string;
  synonyms?: string[];
  courseId: string;
  isDark: boolean;
  isActive?: boolean;
  isReviewMode?: boolean;
  reviewMaskTarget?: ReviewMaskTarget;
}

export function SwipeCardItemCardInfoSection({
  item,
  word,
  pronunciation,
  localizedPronunciation,
  meaning,
  example,
  translation,
  synonyms,
  courseId,
  isDark,
  isActive = true,
  isReviewMode = false,
  reviewMaskTarget = "word",
}: CardInfoSectionProps) {
  const bgColors = getBackgroundColors(isDark);

  return (
    <View
      style={[
        styles.cardInfo,
        { backgroundColor: bgColors.learningCardSurface },
      ]}
    >
      <View testID="swipe-card-info-content" style={styles.cardInfoContent}>
        <SwipeCardItemMeaningExampleSentenceSection
          item={item}
          word={word}
          pronunciation={pronunciation}
          localizedPronunciation={localizedPronunciation}
          meaning={meaning}
          example={example}
          translation={translation}
          synonyms={synonyms}
          courseId={courseId}
          isDark={isDark}
          isActive={isActive}
          isReviewMode={isReviewMode}
          reviewMaskTarget={reviewMaskTarget}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardInfo: {
    justifyContent: "flex-start",
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 12,
  },
  cardInfoContent: {
    paddingBottom: 8,
  },
});
