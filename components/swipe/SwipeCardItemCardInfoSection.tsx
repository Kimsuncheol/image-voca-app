import React from "react";
import { StyleSheet, View } from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import type { ReviewMaskTarget } from "../../src/services/speechPreferences";
import { VocabularyCard } from "../../src/types/vocabulary";
import { MaskVisibilityToggle } from "../common/MaskVisibilityToggle";
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
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isPreviewMode?: boolean;
  isReviewMode?: boolean;
  reviewMaskTarget?: ReviewMaskTarget;
  onMaskChange?: (enabled: boolean) => void;
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
  initialIsSaved = false,
  day,
  onSavedWordChange,
  isPreviewMode = false,
  isReviewMode = false,
  reviewMaskTarget = "word-pronunciation",
  onMaskChange = () => {},
}: CardInfoSectionProps) {
  const bgColors = getBackgroundColors(isDark);

  return (
    <View
      style={[
        styles.cardInfo,
        { backgroundColor: bgColors.learningCardSurface },
      ]}
    >
      {/* Merged Word, Meaning & Example Section */}
      <View style={styles.cardInfoContent}>
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
          initialIsSaved={initialIsSaved}
          day={day}
          onSavedWordChange={onSavedWordChange}
          isPreviewMode={isPreviewMode}
          isReviewMode={isReviewMode}
          reviewMaskTarget={reviewMaskTarget}
        />
      </View>

      <View
        testID="swipe-card-mask-toggle-row"
        style={styles.maskToggleRow}
      >
        <MaskVisibilityToggle
          isDark={isDark}
          isMaskEnabled={isReviewMode}
          onMaskChange={onMaskChange}
          testID="swipe-card-mask-toggle"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardInfo: {
    height: "62%",
    justifyContent: "flex-start",
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 20,
  },
  cardInfoContent: {
    flex: 1,
    minHeight: 0,
  },
  maskToggleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
  },
});
