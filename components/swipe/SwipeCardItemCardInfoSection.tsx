import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
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
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isPreviewMode?: boolean;
  isReviewMode?: boolean;
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
  onMaskChange = () => {},
}: CardInfoSectionProps) {
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const { t } = useTranslation();

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
        />
      </View>

      <View
        testID="swipe-card-mask-toggle-row"
        style={styles.maskToggleRow}
      >
        <View
          testID="swipe-card-mask-toggle"
          style={[
            styles.maskToggleGroup,
            {
              backgroundColor: bgColors.learningCardSurfaceAlt,
              borderColor: fontColors.learningCardDividerMuted,
            },
          ]}
        >
          {([true, false] as const).map((enabled) => {
            const isSelected = isReviewMode === enabled;
            const labelKey = enabled ? "course.mask" : "course.show";
            const defaultValue = enabled ? "Mask" : "Show";

            return (
              <TouchableOpacity
                key={labelKey}
                testID={
                  enabled
                    ? "swipe-card-mask-toggle-mask"
                    : "swipe-card-mask-toggle-show"
                }
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                activeOpacity={0.78}
                onPress={() => onMaskChange(enabled)}
                style={[
                  styles.maskToggleSegment,
                  {
                    backgroundColor: isSelected
                      ? bgColors.learningCardSurface
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.maskToggleText,
                    {
                      color: isSelected
                        ? fontColors.learningCardPrimary
                        : fontColors.learningCardMuted,
                    },
                  ]}
                >
                  {t(labelKey, { defaultValue })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
  maskToggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
  },
  maskToggleSegment: {
    minHeight: 30,
    minWidth: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  maskToggleText: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.bold,
  },
});
