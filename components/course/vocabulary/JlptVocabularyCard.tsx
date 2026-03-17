import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSpeech } from "../../../src/hooks/useSpeech";
import { useTheme } from "../../../src/context/ThemeContext";
import { VocabularyCard } from "../../../src/types/vocabulary";
import { InlineMeaningWithChips } from "../../common/InlineMeaningWithChips";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";
import { SwipeCardItemImageSection } from "../../swipe/SwipeCardItemImageSection";

const { width } = Dimensions.get("window");

const WORD_TTS_OPTIONS = {
  language: "en-US",
  rate: 0.9,
} as const;

interface JlptVocabularyCardProps {
  item: VocabularyCard;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

interface LabeledMeaningRowProps {
  testID: string;
  label: string;
  meaning?: string;
  isDark: boolean;
}

interface ExampleBlockProps {
  example?: string;
  englishTranslation?: string;
  koreanTranslation?: string;
  isDark: boolean;
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
  label,
  meaning,
  isDark,
}: LabeledMeaningRowProps) {
  const displayMeaning = toDisplayValue(meaning);

  if (!displayMeaning) {
    return null;
  }

  return (
    <View testID={testID} style={styles.meaningRow}>
      <Text
        style={[
          styles.sectionLabel,
          { color: isDark ? "#9CA3AF" : "#6B7280" },
        ]}
      >
        {label}
      </Text>
      <InlineMeaningWithChips
        meaning={displayMeaning}
        isDark={isDark}
        textStyle={[
          styles.cardDescription,
          { color: isDark ? "#e0e0e0" : "#2c2c2c" },
        ]}
        containerStyle={styles.inlineMeaning}
        chipStyle={styles.inlineChip}
        testID={`${testID}-content`}
      />
    </View>
  );
}

function ExampleBlock({
  example,
  englishTranslation,
  koreanTranslation,
  isDark,
}: ExampleBlockProps) {
  const { speak } = useSpeech();
  const { t } = useTranslation();
  const examples = React.useMemo(() => splitLines(example), [example]);
  const englishTranslations = React.useMemo(
    () => splitLines(englishTranslation),
    [englishTranslation],
  );
  const koreanTranslations = React.useMemo(
    () => splitLines(koreanTranslation),
    [koreanTranslation],
  );

  const rowCount = Math.max(
    examples.length,
    englishTranslations.length,
    koreanTranslations.length,
  );
  const rowIndices = React.useMemo(
    () => Array.from({ length: rowCount }, (_, index) => index),
    [rowCount],
  );

  const handleSpeak = React.useCallback(
    async (text: string) => {
      try {
        await speak(text, {
          language: "en-US",
          pitch: 1.0,
          rate: 0.9,
        });
      } catch (error) {
        console.error("TTS error:", error);
      }
    },
    [speak],
  );

  if (rowCount === 0) {
    return null;
  }

  return (
    <View style={styles.exampleSection}>
      {rowIndices.map((index) => {
        const exampleText = examples[index];
        const englishTranslationText = englishTranslations[index];
        const koreanTranslationText = koreanTranslations[index];

        return (
          <View key={index} style={styles.exampleGroup}>
            {exampleText ? (
              <>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {t("notifications.labels.example", {
                    defaultValue: "Example",
                  })}
                </Text>
                <TouchableOpacity
                  onPress={() => handleSpeak(exampleText)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cardExample,
                      { color: isDark ? "#b0b0b0" : "#444" },
                      { borderLeftColor: isDark ? "#0a84ff" : "#007AFF" },
                    ]}
                    numberOfLines={2}
                  >
                    {exampleText}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {englishTranslationText ? (
              <Text
                testID={index === 0 ? "jlpt-card-translation-english" : undefined}
                style={[
                  styles.cardTranslation,
                  { color: isDark ? "#a8e6a1" : "#2d5f2d" },
                  { borderLeftColor: isDark ? "#34c759" : "#28a745" },
                ]}
                numberOfLines={2}
              >
                {`${t("swipe.jlpt.labels.translationEnglish", {
                  defaultValue: "English Translation",
                })}: ${englishTranslationText}`}
              </Text>
            ) : null}

            {koreanTranslationText ? (
              <Text
                testID={index === 0 ? "jlpt-card-translation-korean" : undefined}
                style={[
                  styles.cardTranslation,
                  { color: isDark ? "#ffd6a5" : "#8B4513" },
                  { borderLeftColor: isDark ? "#ff9f0a" : "#D97706" },
                ]}
                numberOfLines={2}
              >
                {`${t("swipe.jlpt.labels.translationKorean", {
                  defaultValue: "Korean Translation",
                })}: ${koreanTranslationText}`}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function JlptVocabularyCard({
  item,
  initialIsSaved = false,
  day,
  onSavedWordChange,
}: JlptVocabularyCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { speak: speakText } = useSpeech();

  const englishMeaning = toDisplayValue(item.localized?.en?.meaning) ?? item.meaning;
  const koreanMeaning = toDisplayValue(item.localized?.ko?.meaning);
  const englishTranslation = toDisplayValue(item.localized?.en?.translation);
  const koreanTranslation = toDisplayValue(item.localized?.ko?.translation);
  const pronunciation = toDisplayValue(item.pronunciation);
  const pronunciationRoman = toDisplayValue(item.pronunciationRoman);

  const handlePressWord = React.useCallback(() => {
    void speakText(item.word, WORD_TTS_OPTIONS);
  }, [item.word, speakText]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        { borderColor: isDark ? "#333" : "#E0E0E0" },
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
          { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        ]}
      >
        <ScrollView
          testID="jlpt-card-info-scroll"
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
                    { color: isDark ? "#fff" : "#1a1a1a" },
                  ]}
                  numberOfLines={1}
                >
                  {item.word}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addButtonContainer}>
              <SwipeCardItemAddToWordBankButton
                item={item}
                isDark={isDark}
                initialIsSaved={initialIsSaved}
                day={day}
                onSavedWordChange={onSavedWordChange}
              />
            </View>
          </View>

          {pronunciation ? (
            <Text
              testID="jlpt-card-pronunciation"
              style={[styles.cardSubtitle, { color: isDark ? "#999" : "#666" }]}
            >
              {`${t("notifications.labels.pronunciation", {
                defaultValue: "Pronunciation",
              })}: ${pronunciation}`}
            </Text>
          ) : null}
          {pronunciationRoman ? (
            <Text
              testID="jlpt-card-pronunciation-roman"
              style={[styles.cardSubtitle, { color: isDark ? "#999" : "#666" }]}
            >
              {`${t("notifications.labels.pronunciationRoman", {
                defaultValue: "Roman",
              })}: ${pronunciationRoman}`}
            </Text>
          ) : null}

          <View style={styles.meaningSection}>
            <LabeledMeaningRow
              testID="jlpt-card-meaning-english"
              label={t("swipe.jlpt.labels.meaningEnglish", {
                defaultValue: "English Meaning",
              })}
              meaning={englishMeaning}
              isDark={isDark}
            />
            <LabeledMeaningRow
              testID="jlpt-card-meaning-korean"
              label={t("swipe.jlpt.labels.meaningKorean", {
                defaultValue: "Korean Meaning",
              })}
              meaning={koreanMeaning}
              isDark={isDark}
            />
          </View>

          <ExampleBlock
            example={item.example}
            englishTranslation={englishTranslation}
            koreanTranslation={koreanTranslation}
            isDark={isDark}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
  cardInfo: {
    height: "65%",
    backgroundColor: "#fff",
  },
  cardInfoContent: {
    padding: 24,
    paddingBottom: 32,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 1,
    minWidth: 0,
  },
  addButtonContainer: {
    marginLeft: "auto",
    paddingLeft: 12,
    alignSelf: "flex-start",
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#666",
    fontStyle: "italic",
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
    fontSize: 12,
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
    fontSize: 17,
    color: "#2c2c2c",
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
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    lineHeight: 20,
  },
  cardTranslation: {
    fontSize: 16,
    fontWeight: "500",
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginTop: 4,
    lineHeight: 22,
  },
});
