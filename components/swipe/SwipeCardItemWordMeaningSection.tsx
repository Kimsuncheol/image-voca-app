import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getFontColors } from "../../constants/fontColors";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useStudySpeech } from "../../src/hooks/useStudyMode";
import { VocabularyCard } from "../../src/types/vocabulary";
import { getIdiomTitleFontSize } from "../../src/utils/idiomDisplay";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";
import { FontSizes } from "@/constants/fontSizes";
import { SwipeCardItemAddToWordBankButton } from "./SwipeCardItemAddToWordBankButton";

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
  isPreviewMode?: boolean;
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
  isPreviewMode = false,
}: SwipeCardItemWordMeaningSectionProps) {
  const fontColors = getFontColors(isDark);
  useCardSpeechCleanup(isActive);
  const { handleSpeech } = useStudySpeech();
  const speakText = React.useCallback(
    (text: string, options?: Parameters<typeof handleSpeech>[2]) =>
      handleSpeech(text, "EN", options),
    [handleSpeech],
  );
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
    () => getIdiomTitleFontSize(longestWordVariant, item.course, FontSizes.displayXl),
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
              { color: fontColors.learningCardPrimary },
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
        <View style={styles.titleActions}>
          {!isPreviewMode && (
            <SwipeCardItemAddToWordBankButton
              item={item}
              isDark={isDark}
              initialIsSaved={initialIsSaved}
              day={day}
              onSavedWordChange={onSavedWordChange}
            />
          )}
        </View>
      </View>
      {normalizedPronunciation ? (
        <Text
          style={[
            styles.cardSubtitle,
            { color: fontColors.learningCardMuted },
          ]}
        >
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
            { color: fontColors.learningCardSecondary },
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
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 8,
  },
  cardTitle: {
    fontSize: FontSizes.displayXl,
    fontWeight: FontWeights.black,
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
    lineHeight: LineHeights.headingLg,
    fontWeight: FontWeights.semiBold,
  },
});
