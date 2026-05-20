import { FontWeights } from "@/constants/fontWeights";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { BorderColors, getBorderColors } from "../../constants/borderColors";
import { getFontColors } from "../../constants/fontColors";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useJapaneseContentLanguage } from "../../src/hooks/useJapaneseContentLanguage";
import { useStudySpeech } from "../../src/hooks/useStudyMode";
import { FontSizes } from "@/constants/fontSizes";
import {
  buildKanjiMeaningDisplayRows,
  buildKanjiReadingDisplayRows,
} from "../../src/utils/kanjiDisplayRows";
import { DayBadge } from "../common/DayBadge";
import { ImagePlaceholder } from "../common/ImagePlaceholder";
import { DottedDivider } from "../course/vocabulary/KanjiCollocationCardDivider";
import { GeneralBackSection } from "../course/vocabulary/KanjiCollocationCardGeneralBackSection";

import type { SavedWord } from "./WordCard";
import { LineHeights } from "@/constants/lineHeights";
import type { ReviewMaskTarget } from "../../src/services/speechPreferences";
import { shouldMaskReviewContent } from "../../src/utils/reviewMasking";
import { getWordBankReviewTapeTextStyle } from "./wordBankMasking";

interface KanjiWordBankCardProps {
  word: SavedWord;
  isDark: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isReviewMode?: boolean;
  reviewMaskTarget?: ReviewMaskTarget;
}

export function KanjiWordBankCard({
  word,
  isDark,
  onSavedWordChange,
  isReviewMode = false,
  reviewMaskTarget = "word",
}: KanjiWordBankCardProps) {
  const { handleSpeech } = useStudySpeech();
  useCardSpeechCleanup();
  const { i18n } = useTranslation();
  const language = useJapaneseContentLanguage(word.course, i18n.language);
  const useKorean = language === "ko";
  const bgColors = getBackgroundColors(isDark);
  const borderColors = getBorderColors(isDark);
  const fontColors = getFontColors(isDark);
  const maskStyle = getWordBankReviewTapeTextStyle(isDark);
  const maskWord = shouldMaskReviewContent(
    isReviewMode,
    reviewMaskTarget,
    "word",
  );
  const maskMeaning = shouldMaskReviewContent(
    isReviewMode,
    reviewMaskTarget,
    "meaning",
  );
  const maskReading = shouldMaskReviewContent(
    isReviewMode,
    reviewMaskTarget,
    "reading",
  );

  const [showFurigana, setShowFurigana] = React.useState(false);

  const meanings = buildKanjiMeaningDisplayRows(word, language);
  const readings = buildKanjiReadingDisplayRows(word, language);

  const exampleTranslations = useKorean
    ? (word.exampleKoreanTranslation ?? [])
    : (word.exampleEnglishTranslation ?? []);

  const handleSpeakRow = React.useCallback(
    (text?: string) => {
      const speechText = text?.trim();
      if (!speechText) return;
      void handleSpeech(speechText, "JP");
    },
    [handleSpeech],
  );
  const handleStaticExampleRowPress = React.useCallback(() => {}, []);

  const hasGeneralExamples = (word.exampleHurigana?.length ?? 0) > 0 ||
    ((word.example as string[] | string | undefined) instanceof Array
      ? (word.example as string[]).length > 0
      : false);

  const exampleArray: string[] =
    Array.isArray(word.example) ? word.example : [];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bgColors.learningCardSurfaceAlt },
      ]}
    >
      {/* Header: kanji + day badge + image */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.kanjiText,
              { color: fontColors.primary },
              maskWord ? maskStyle : undefined,
            ]}
          >
            {word.kanji}
          </Text>
        </View>
        <View
          testID="kanji-word-bank-header-right"
          style={styles.headerRight}
        >
          {word.day !== undefined ? (
            <View testID="kanji-word-bank-day-badge">
              <DayBadge day={word.day} />
            </View>
          ) : null}
          <View
            testID="kanji-word-bank-image-container"
            style={styles.imageContainer}
          >
            {word.imageUrl ? (
              <Image
                source={{ uri: word.imageUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <ImagePlaceholder isDark={isDark} style={styles.thumbnail} />
            )}

          </View>
        </View>
      </View>

      {/* Meaning chips */}
      {meanings.length > 0 && (
        <View style={styles.chipsSection}>
          <Text
            style={[styles.sectionLabel, { color: fontColors.muted }]}
          >
            MEANING
          </Text>
          <View style={styles.chipRow}>
            {meanings.map((row, i) => (
              <TouchableOpacity
                key={`m-${i}`}
                testID={`kanji-word-bank-meaning-row-${i}`}
                activeOpacity={0.7}
                onPress={() => handleSpeakRow(row.baseText)}
                style={{ flexDirection: "row", alignItems: "baseline", gap: 24 }}
              >
                {row.localizedText ? (
                  <Text
                    style={[
                      styles.chipText,
                      { color: fontColors.subtle, fontSize: FontSizes.body },
                      maskMeaning ? maskStyle : undefined,
                    ]}
                  >
                    {row.localizedText}
                  </Text>
                ) : null}
                {row.baseText ? (
                  <Text
                    style={[
                      styles.chipText,
                      { color: fontColors.secondary },
                      maskMeaning ? maskStyle : undefined,
                    ]}
                  >
                    {row.baseText}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Reading chips */}
      {readings.length > 0 && (
        <View style={styles.chipsSection}>
          <Text
            style={[styles.sectionLabel, { color: fontColors.muted }]}
          >
            READING
          </Text>
          <View style={styles.chipRow}>
            {readings.map((row, i) => (
              <TouchableOpacity
                key={`r-${i}`}
                testID={`kanji-word-bank-reading-row-${i}`}
                activeOpacity={0.7}
                onPress={() => handleSpeakRow(row.baseText)}
                style={{ flexDirection: "row", alignItems: "baseline", gap: 24 }}
              >
                {row.localizedText ? (
                  <Text
                    style={[
                      styles.chipText,
                      { color: fontColors.subtle, fontSize: FontSizes.body },
                      maskReading ? maskStyle : undefined,
                    ]}
                  >
                    {row.localizedText}
                  </Text>
                ) : null}
                {row.baseText ? (
                  <Text
                    style={[
                      styles.chipText,
                      { color: fontColors.secondary },
                      maskReading ? maskStyle : undefined,
                    ]}
                  >
                    {row.baseText}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <DottedDivider isDark={isDark} />

      {/* General examples */}
      {hasGeneralExamples && (
        <View style={styles.exampleSection}>
          <View style={styles.exampleHeader}>
            <TouchableOpacity
              onPress={() => setShowFurigana((v) => !v)}
              activeOpacity={0.7}
              style={[
                styles.furiganaButton,
                showFurigana
                  ? { backgroundColor: bgColors.learningCardKanaActive }
                  : {
                      borderColor: borderColors.learningCardDividerMuted,
                      borderWidth: 1,
                    },
              ]}
            >
              <Text
                style={[
                  styles.furiganaButtonText,
                  {
                    color: showFurigana
                      ? fontColors.inverse
                      : fontColors.learningCardMuted,
                  },
                ]}
              >
                がな
              </Text>
            </TouchableOpacity>
          </View>
          <GeneralBackSection
            examples={exampleArray}
            hurigana={word.exampleHurigana ?? []}
            translations={exampleTranslations}
            isDark={isDark}
            isActive={true}
            showFurigana={showFurigana}
            isReviewMode={isReviewMode}
            reviewMaskTarget={reviewMaskTarget}
            maskTextStyle={maskStyle}
            onFlip={handleStaticExampleRowPress}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: BorderColors.light.transparent,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  imageContainer: {
    position: "relative",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    flexShrink: 0,
  },
  kanjiText: {
    fontSize: FontSizes.displayXxl,
    fontWeight: FontWeights.bold,
  },
  thumbnail: {
    width: 110,
    height: 110,
    borderRadius: 12,
  },
  chipsSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipText: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.semiBold,
    lineHeight: LineHeights.titleXl,
  },
  exampleSection: {
    gap: 8,
  },
  exampleHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  furiganaButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  furiganaButtonText: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.semiBold,
  },
});
