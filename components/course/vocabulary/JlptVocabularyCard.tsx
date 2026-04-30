import { FontWeights } from "@/constants/fontWeights";
import { FontSizes } from "@/constants/fontSizes";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../../src/hooks/useCardSpeechCleanup";
import { useStudySpeech } from "../../../src/hooks/useStudyMode";
import { VocabularyCard } from "../../../src/types/vocabulary";
import {
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../../../src/utils/japaneseText";
import { resolveVocabularyContent } from "../../../src/utils/localizedVocabulary";
import { InlineMeaningWithChips } from "../../common/InlineMeaningWithChips";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";
import { SwipeCardItemImageSection } from "../../swipe/SwipeCardItemImageSection";
import { LineHeights } from "@/constants/lineHeights";

const { width } = Dimensions.get("window");

interface JlptVocabularyCardProps {
  item: VocabularyCard;
  initialIsSaved?: boolean;
  day?: number;
  isActive?: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  showKana?: boolean;
  onToggleKana?: () => void;
  isPreviewMode?: boolean;
}

interface LabeledMeaningRowProps {
  testID: string;
  meaning?: string;
  isDark: boolean;
}

interface ExampleBlockProps {
  example?: string;
  exampleFurigana?: string;
  translation?: string;
  isDark: boolean;
  isActive: boolean;
  showKana: boolean;
}

const getDynamicFontSize = (text: string, baseFontSize: number, minFontSize: number): number => {
  const { width } = Dimensions.get("window");
  const availableWidth = width * 0.8;
  const textLength = text.length;

  const charWidthRatio = 0.6;
  const estimatedWidth = textLength * baseFontSize * charWidthRatio;

  if (estimatedWidth <= availableWidth) {
    return baseFontSize;
  }

  const scaledFontSize = availableWidth / (textLength * charWidthRatio);
  return Math.max(minFontSize, Math.min(baseFontSize, scaledFontSize));
};

const toDisplayValue = (value?: string) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const splitLines = (value?: string) =>
  value
    ?.split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean) ?? [];

function LabeledMeaningRow({
  testID,
  meaning,
  isDark,
}: LabeledMeaningRowProps) {
  const displayMeaning = toDisplayValue(meaning);
  const fontColors = getFontColors(isDark);

  if (!displayMeaning) {
    return null;
  }

  return (
    <View testID={testID} style={styles.meaningRow}>
      <InlineMeaningWithChips
        meaning={displayMeaning}
        isDark={isDark}
        textStyle={[
          styles.cardDescription,
          { color: fontColors.learningCardSecondary },
        ]}
        containerStyle={styles.inlineMeaning}
        chipStyle={styles.inlineChip}
        testID={`${testID}-content`}
        forceInline
      />
    </View>
  );
}

const ExampleBlock = React.memo(function ExampleBlock({
  example,
  exampleFurigana,
  translation,
  isDark,
  isActive,
  showKana,
}: ExampleBlockProps) {
  const fontColors = getFontColors(isDark);
  useCardSpeechCleanup(isActive);
  const { handleSpeech } = useStudySpeech();
  const hiddenExample = React.useMemo(
    () => (example ? stripKanaParens(example) : example),
    [example],
  );
  const processedExample = showKana ? example : hiddenExample;
  const examples = React.useMemo(
    () => splitLines(processedExample),
    [processedExample],
  );
  const furiganaLines = React.useMemo(
    () => splitLines(exampleFurigana),
    [exampleFurigana],
  );
  const translations = React.useMemo(
    () => splitLines(translation),
    [translation],
  );

  const rowCount = Math.max(examples.length, translations.length);
  const rowIndices = React.useMemo(
    () => Array.from({ length: rowCount }, (_, index) => index),
    [rowCount],
  );

  const handleSpeak = React.useCallback(
    (text: string, index: number) => {
      if (!isActive) {
        return;
      }
      const ttsText = furiganaLines[index] ?? stripKanaParens(text);
      void handleSpeech(ttsText, "JP");
    },
    [handleSpeech, isActive, furiganaLines],
  );

  if (rowCount === 0) {
    return null;
  }

  return (
    <View style={styles.exampleSection}>
      {rowIndices.map((index) => {
        const exampleText = examples[index];
        const translationText = translations[index];
        const exampleSegments = exampleText
          ? splitJapaneseTextSegments(exampleText)
          : [];

        return (
          <View key={index} style={styles.exampleGroup}>
            {exampleText ? (
              <TouchableOpacity
                onPress={() => handleSpeak(exampleText, index)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cardExample,
                    { color: fontColors.learningCardPrimary },
                  ]}
                  numberOfLines={2}
                >
                  {exampleSegments.map((segment, segmentIndex) => (
                    <Text
                      key={`${index}-${segmentIndex}`}
                      testID={
                        segment.isKanaParen
                          ? `jlpt-card-furigana-${index}-${segmentIndex}`
                          : undefined
                      }
                      style={
                        segment.isKanaParen
                          ? [
                              styles.cardFurigana,
                              { color: fontColors.learningCardMuted },
                            ]
                          : undefined
                      }
                    >
                      {segment.text}
                    </Text>
                  ))}
                </Text>
              </TouchableOpacity>
            ) : null}

            {translationText ? (
              <Text
                testID={index === 0 ? "jlpt-card-translation" : undefined}
                  style={[
                    styles.cardTranslation,
                    { color: fontColors.learningCardMuted },
                  ]}
                numberOfLines={2}
              >
                {translationText}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
});

export function JlptVocabularyCard({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
  showKana = false,
  onToggleKana = () => {},
  isPreviewMode = false,
}: JlptVocabularyCardProps) {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const { i18n } = useTranslation();
  const { handleSpeech } = useStudySpeech();
  useCardSpeechCleanup(isActive);
  const resolved = React.useMemo(
    () => resolveVocabularyContent(item, i18n.language),
    [i18n.language, item],
  );
  const displayWord = toDisplayValue(item.word);
  const pronunciation = React.useMemo(() => {
    const candidate = toDisplayValue(resolved.sharedPronunciation);
    if (!candidate) {
      return undefined;
    }
    return candidate === displayWord ? undefined : candidate;
  }, [displayWord, resolved.sharedPronunciation]);

  const handlePressWord = React.useCallback(() => {
    if (!isActive) {
      return;
    }
    void handleSpeech(resolved.sharedPronunciation ?? item.word, "JP");
  }, [handleSpeech, isActive, item.word, resolved.sharedPronunciation]);

  const dynamicFontSize = React.useMemo(() => {
    return getDynamicFontSize(item.word, 48, 24);
  }, [item.word]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColors.learningCardSurface,
          borderColor: bgColors.learningCardSurface,
        },
      ]}
    >
      <SwipeCardItemImageSection
        testID="jlpt-card-image-shell"
        imageUrl={item.imageUrl}
        isDark={isDark}
      />

      <View
        testID="jlpt-card-info"
        style={[
          styles.cardInfo,
          { backgroundColor: bgColors.learningCardSurface },
        ]}
      >
        <ScrollView
          testID="jlpt-card-info-scroll"
          style={styles.cardInfoScroll}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.cardInfoContent}
        >
          <View style={styles.titleContainer}>
            <View style={styles.leftRow}>
              <TouchableOpacity onPress={handlePressWord} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: fontColors.learningCardPrimary,
                      fontSize: dynamicFontSize,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {item.word}
                </Text>
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

          {pronunciation ? (
            <Text
              testID="jlpt-card-pronunciation"
              style={[
                styles.cardSubtitle,
                { color: fontColors.learningCardMuted },
              ]}
            >
              {pronunciation}
            </Text>
          ) : null}

          <View style={styles.meaningSection}>
            <LabeledMeaningRow
              testID="jlpt-card-meaning"
              meaning={resolved.meaning}
              isDark={isDark}
            />
          </View>

          <ExampleBlock
            example={resolved.example}
            exampleFurigana={resolved.exampleFurigana}
            translation={resolved.translation}
            isDark={isDark}
            isActive={isActive}
            showKana={showKana}
          />
        </ScrollView>

        {resolved.exampleFurigana !== resolved.example ? (
          <View testID="jlpt-card-kana-toggle-bar" style={styles.kanaToggleBar}>
            <Pressable
              testID="jlpt-card-kana-toggle-pill"
              onPress={onToggleKana}
              style={[
                styles.kanaTogglePill,
                showKana && styles.kanaTogglePillActive,
                {
                  borderColor: showKana
                    ? bgColors.learningCardKanaActive
                    : fontColors.learningCardDividerMuted,
                  backgroundColor: showKana
                    ? bgColors.learningCardKanaActive
                    : bgColors.transparent,
                },
              ]}
            >
              <Text
                style={[
                  styles.kanaToggleText,
                  {
                    color: showKana
                      ? fontColors.inverse
                      : fontColors.learningCardMuted,
                  },
                ]}
              >
                がな
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    borderRadius: 0,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  cardInfo: {
    height: "65%",
    flexDirection: "column",
  },
  cardInfoScroll: {
    flex: 1,
  },
  cardInfoContent: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 32,
  },
  kanaToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  kanaTogglePill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 0,
  },
  kanaTogglePillActive: {
    backgroundColor: "transparent",
  },
  kanaToggleText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.5,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
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
    fontSize: FontSizes.headingXl,
    fontWeight: FontWeights.black,
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: FontSizes.bodyMd,
    marginTop: 2,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  meaningSection: {
    marginTop: 4,
    marginBottom: 8,
    gap: 10,
  },
  meaningRow: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  inlineMeaning: {
    gap: 4,
  },
  inlineChip: {
    marginRight: 6,
  },
  cardDescription: {
    fontSize: FontSizes.subhead,
    lineHeight: LineHeights.titleXl,
    fontWeight: FontWeights.medium,
  },
  exampleSection: {
    marginTop: 4,
  },
  exampleGroup: {
    marginTop: 8,
  },
  cardExample: {
    fontSize: FontSizes.titleMd,
    fontWeight: FontWeights.semiBold,
    lineHeight: LineHeights.headingMd,
  },
  cardTranslation: {
    fontSize: FontSizes.bodyMd,
    fontWeight: FontWeights.medium,
    marginTop: 2,
    lineHeight: LineHeights.titleLg,
  },
  cardFurigana: {
    fontSize: FontSizes.caption,
  },
});
