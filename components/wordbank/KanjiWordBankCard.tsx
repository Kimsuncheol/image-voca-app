import { FontWeights } from "@/constants/fontWeights";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
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

interface KanjiWordBankCardProps {
  word: SavedWord;
  isDark: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

export function KanjiWordBankCard({
  word,
  isDark,
  onSavedWordChange,
}: KanjiWordBankCardProps) {
  const { speak } = useSpeech();
  useCardSpeechCleanup();
  const { i18n } = useTranslation();
  const useKorean = i18n.language === "ko";
  const language = i18n.language;
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  const [showFurigana, setShowFurigana] = React.useState(false);

  const meanings = buildKanjiMeaningDisplayRows(word, language);
  const readings = buildKanjiReadingDisplayRows(word, language);

  const exampleTranslations = useKorean
    ? (word.exampleKoreanTranslation ?? [])
    : (word.exampleEnglishTranslation ?? []);

  const handleSpeakKanji = React.useCallback(() => {
    void speak(word.kanji ?? "", { language: "ja-JP" });
  }, [speak, word.kanji]);
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
      {/* Header: kanji + image + day badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleSpeakKanji} activeOpacity={0.7}>
            <Text
              style={[styles.kanjiText, { color: fontColors.primary }]}
            >
              {word.kanji}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.imageContainer}>
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
          {word.day !== undefined && <DayBadge day={word.day} />}
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
              <View
                key={`m-${i}`}
                style={{ flexDirection: "row", alignItems: "baseline", gap: 24 }}
              >
                {row.localizedText ? (
                  <Text
                    style={[
                      styles.chipText,
                      { color: fontColors.subtle, fontSize: FontSizes.body },
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
                    ]}
                  >
                    {row.baseText}
                  </Text>
                ) : null}
              </View>
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
              <View
                key={`r-${i}`}
                style={{ flexDirection: "row", alignItems: "baseline", gap: 24 }}
              >
                {row.localizedText ? (
                  <Text
                    style={[
                      styles.chipText,
                      { color: fontColors.subtle, fontSize: FontSizes.body },
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
                    ]}
                  >
                    {row.baseText}
                  </Text>
                ) : null}
              </View>
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
                      borderColor: fontColors.learningCardDividerMuted,
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
    borderColor: "transparent",
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
