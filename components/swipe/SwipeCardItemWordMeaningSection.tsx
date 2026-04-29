import { LineHeights } from "@/constants/lineHeights";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
import { VocabularyCard } from "../../src/types/vocabulary";
import { getIdiomTitleFontSize } from "../../src/utils/idiomDisplay";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";
import { FontSizes } from "@/constants/fontSizes";
import {
  blackCardColors,
  blackCardSharedStyles,
} from "../course/vocabulary/blackCardStyles";

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
  const longestWordVariant = React.useMemo(
    () =>
      wordVariants.reduce(
        (longest, variant) => (variant.length > longest.length ? variant : longest),
        wordVariants[0] ?? word,
      ),
    [word, wordVariants],
  );
  const titleFontSize = React.useMemo(
    () => getIdiomTitleFontSize(longestWordVariant, item.course, 50),
    [item.course, longestWordVariant],
  );
  const titleLineHeight = React.useMemo(
    () => Math.round(titleFontSize * 1.18),
    [titleFontSize],
  );

  const speak = React.useCallback(async () => {
    if (!isActive) {
      return;
    }

    await speakWordVariants(word, speakText, {
      language: "en-US",
    });
  }, [isActive, speakText, word]);

  const handlePressWord = React.useCallback(() => {
    void speak();
  }, [speak]);

  const renderWord = () => {
    return (
      <View style={styles.wordVariantsContainer}>
        {wordVariants.map((variant, index) => (
          <Text
            key={`${variant}-${index}`}
            testID={index === 0 ? "swipe-card-word-title" : undefined}
            style={[
              styles.cardTitle,
              { color: blackCardColors.primary },
              index > 0 && styles.cardTitleVariant,
              { fontSize: titleFontSize, lineHeight: titleLineHeight },
            ]}
            numberOfLines={isMultiVariantWord ? undefined : 1}
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
        {day !== undefined && (
          <View style={blackCardSharedStyles.dayPill}>
            <Text style={blackCardSharedStyles.dayPillText}>Day {day}</Text>
          </View>
        )}
      </View>
      {normalizedPronunciation ? (
        <Text style={styles.cardSubtitle}>
          {normalizedPronunciation}
        </Text>
      ) : null}
      <View style={styles.meaningSection}>
        <InlineMeaningWithChips
          meaning={meaning}
          courseId={item.course}
          isDark={isDark}
          textStyle={[
            styles.cardDescription,
            { color: blackCardColors.secondary },
          ]}
          containerStyle={styles.inlineMeaning}
          chipStyle={styles.inlineChip}
          testID="inline-meaning"
          splitPosSegmentsIntoRows
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 16,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: FontSizes.displayXl,
    fontWeight: "900",
    color: blackCardColors.primary,
    flexShrink: 1,
    letterSpacing: 0,
  },
  wordVariantsContainer: {
    gap: 4,
  },
  cardTitleVariant: {
    lineHeight: LineHeights.displayLg,
  },
  cardSubtitle: {
    fontSize: FontSizes.bodyMd,
    color: blackCardColors.muted,
    fontStyle: "italic",
    marginTop: -2,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  meaningSection: {
    marginBottom: 14,
  },
  inlineMeaning: {
    gap: 7,
  },
  inlineChip: {
    marginRight: 4,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  cardDescription: {
    fontSize: FontSizes.titleLg,
    color: blackCardColors.secondary,
    lineHeight: LineHeights.headingLg,
    fontWeight: "600",
  },
});
