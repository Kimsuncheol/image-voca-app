import React from "react";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../../src/hooks/useSpeech";
import { VocabularyCard } from "../../../src/types/vocabulary";
import {
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../../../src/utils/japaneseText";
import { resolveVocabularyContent } from "../../../src/utils/localizedVocabulary";
import { InlineMeaningWithChips } from "../../common/InlineMeaningWithChips";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";
import { SwipeCardItemImageSection } from "../../swipe/SwipeCardItemImageSection";
import { blackCardColors, blackCardSharedStyles } from "./blackCardStyles";

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
          { color: blackCardColors.secondary },
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
  useCardSpeechCleanup(isActive);
  const { speak } = useSpeech();
  const hiddenExample = React.useMemo(
    () => (example ? stripKanaParens(example) : example),
    [example],
  );
  const processedExample = showKana ? example : hiddenExample;
  const examples = React.useMemo(() => splitLines(processedExample), [processedExample]);
  const furiganaLines = React.useMemo(() => splitLines(exampleFurigana), [exampleFurigana]);
  const translations = React.useMemo(() => splitLines(translation), [translation]);

  const rowCount = Math.max(
    examples.length,
    translations.length,
  );
  const rowIndices = React.useMemo(
    () => Array.from({ length: rowCount }, (_, index) => index),
    [rowCount],
  );

  const handleSpeak = React.useCallback((text: string, index: number) => {
    if (!isActive) {
      return;
    }
    const ttsText = furiganaLines[index] ?? stripKanaParens(text);
    void speak(ttsText, { language: "ja-JP" });
  }, [isActive, speak, furiganaLines]);

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
                    { color: blackCardColors.primary },
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
                      style={segment.isKanaParen ? styles.cardFurigana : undefined}
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
                  { color: blackCardColors.muted },
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
  const { i18n } = useTranslation();
  const { speak } = useSpeech();
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
    void speak(resolved.sharedPronunciation ?? item.word, { language: "ja-JP" });
  }, [isActive, item.word, resolved.sharedPronunciation, speak]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: blackCardColors.surface },
      ]}
    >
      <SwipeCardItemImageSection
        testID="jlpt-card-image-shell"
        imageUrl={item.imageUrl}
        isDark={isDark}
        topRightOverlay={
          isPreviewMode ? null : (
            <SwipeCardItemAddToWordBankButton
              item={item}
              isDark={isDark}
              initialIsSaved={initialIsSaved}
              day={day}
              onSavedWordChange={onSavedWordChange}
            />
          )
        }
      />

      <View
        testID="jlpt-card-info"
        style={[
          styles.cardInfo,
          { backgroundColor: blackCardColors.surface },
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
                    { color: blackCardColors.primary },
                  ]}
                  numberOfLines={1}
                >
                  {item.word}
                </Text>
              </TouchableOpacity>
            </View>
            {day !== undefined && (
              <View style={blackCardSharedStyles.dayPill}>
                <Text style={blackCardSharedStyles.dayPillText}>Day {day}</Text>
              </View>
            )}
          </View>

          {pronunciation ? (
            <Text
              testID="jlpt-card-pronunciation"
              style={[styles.cardSubtitle, { color: blackCardColors.muted }]}
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
                    ? "rgba(46, 160, 67, 0.95)"
                    : isDark
                      ? "rgba(255,255,255,0.22)"
                      : "rgba(17,24,28,0.16)",
                },
              ]}
            >
              <Text
                style={[
                  styles.kanaToggleText,
                  { color: showKana ? "#FFFFFF" : blackCardColors.muted },
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
    backgroundColor: blackCardColors.surface,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: blackCardColors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  cardInfo: {
    height: "65%",
    backgroundColor: blackCardColors.surface,
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
    paddingVertical: 12,
  },
  kanaTogglePill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  kanaTogglePillActive: {
    backgroundColor: "#2EA043",
  },
  kanaToggleText: {
    fontSize: FontSizes.body,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: FontSizes.headingXl,
    fontWeight: "900",
    color: blackCardColors.primary,
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: FontSizes.bodyMd,
    color: blackCardColors.muted,
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
    fontWeight: "700",
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
    color: blackCardColors.secondary,
    lineHeight: 24,
    fontWeight: "500",
  },
  exampleSection: {
    marginTop: 4,
  },
  exampleGroup: {
    marginTop: 8,
  },
  cardExample: {
    fontSize: FontSizes.bodyLg,
    fontWeight: "500",
    color: blackCardColors.primary,
    lineHeight: 20,
  },
  cardTranslation: {
    fontSize: FontSizes.caption,
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 22,
  },
  cardFurigana: {
    fontSize: FontSizes.caption,
    color: blackCardColors.muted,
  },
});
