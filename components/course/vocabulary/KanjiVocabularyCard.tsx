import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../../src/hooks/useSpeech";
import type { KanjiNestedListGroup, KanjiWord } from "../../../src/types/vocabulary";
import { DayBadge } from "../../common/DayBadge";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";
import { SwipeCardItemImageSection } from "../../swipe/SwipeCardItemImageSection";

const { width } = Dimensions.get("window");

interface KanjiVocabularyCardProps {
  item: KanjiWord;
  initialIsSaved?: boolean;
  day?: number;
  isActive?: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

interface IndexedGroupSectionProps {
  title: string;
  values: string[];
  examples: KanjiNestedListGroup[];
  hurigana: KanjiNestedListGroup[];
  translations: KanjiNestedListGroup[];
  isDark: boolean;
  isActive: boolean;
  speakLanguage: "ja-JP";
}

interface GeneralExamplesProps {
  word: KanjiWord;
  translations: string[];
  isDark: boolean;
  isActive: boolean;
}

const compactStrings = (values?: string[]) =>
  values?.map((value) => value.trim()).filter(Boolean) ?? [];

const itemsAt = (groups: KanjiNestedListGroup[], index: number) =>
  compactStrings(groups[index]?.items);

function IndexedGroupSection({
  title,
  values,
  examples,
  hurigana,
  translations,
  isDark,
  isActive,
  speakLanguage,
}: IndexedGroupSectionProps) {
  const { speak } = useSpeech();
  const entries = values
    .map((value, index) => ({
      value: value.trim(),
      examples: itemsAt(examples, index),
      hurigana: itemsAt(hurigana, index),
      translations: itemsAt(translations, index),
    }))
    .filter((entry) => entry.value);

  const handleSpeak = React.useCallback(
    (text: string) => {
      if (!isActive) return;
      void speak(text, { language: speakLanguage });
    },
    [isActive, speak, speakLanguage],
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? "#999" : "#666" }]}>
        {title}
      </Text>
      {entries.map((entry, index) => (
        <View key={`${title}-${index}`} style={styles.group}>
          <TouchableOpacity
            onPress={() => handleSpeak(entry.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.groupTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
            >
              {entry.value}
            </Text>
          </TouchableOpacity>

          {entry.examples.map((example, exampleIndex) => (
            <TouchableOpacity
              key={`${title}-${index}-example-${exampleIndex}`}
              onPress={() =>
                handleSpeak(entry.hurigana[exampleIndex] ?? example)
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.example,
                  { color: isDark ? "#b0b0b0" : "#444" },
                  { borderLeftColor: isDark ? "#0a84ff" : "#007AFF" },
                ]}
              >
                {example}
              </Text>
              {entry.hurigana[exampleIndex] ? (
                <Text style={[styles.hurigana, { color: isDark ? "#999" : "#777" }]}>
                  {entry.hurigana[exampleIndex]}
                </Text>
              ) : null}
              {entry.translations[exampleIndex] ? (
                <Text
                  style={[
                    styles.translation,
                    { color: isDark ? "#a8e6a1" : "#2d5f2d" },
                    { borderLeftColor: isDark ? "#34c759" : "#28a745" },
                  ]}
                >
                  {entry.translations[exampleIndex]}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

function GeneralExamples({
  word,
  translations,
  isDark,
  isActive,
}: GeneralExamplesProps) {
  const { speak } = useSpeech();
  const examples = compactStrings(word.example);

  const handleSpeak = React.useCallback(
    (text: string, index: number) => {
      if (!isActive) return;
      void speak(word.exampleHurigana[index] ?? text, { language: "ja-JP" });
    },
    [isActive, speak, word.exampleHurigana],
  );

  if (examples.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? "#999" : "#666" }]}>
        Examples
      </Text>
      {examples.map((example, index) => (
        <View key={`general-example-${index}`} style={styles.group}>
          <TouchableOpacity
            onPress={() => handleSpeak(example, index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.example,
                { color: isDark ? "#b0b0b0" : "#444" },
                { borderLeftColor: isDark ? "#0a84ff" : "#007AFF" },
              ]}
            >
              {example}
            </Text>
          </TouchableOpacity>
          {word.exampleHurigana[index] ? (
            <Text style={[styles.hurigana, { color: isDark ? "#999" : "#777" }]}>
              {word.exampleHurigana[index]}
            </Text>
          ) : null}
          {translations[index] ? (
            <Text
              style={[
                styles.translation,
                { color: isDark ? "#a8e6a1" : "#2d5f2d" },
                { borderLeftColor: isDark ? "#34c759" : "#28a745" },
              ]}
            >
              {translations[index]}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function KanjiVocabularyCard({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
}: KanjiVocabularyCardProps) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  useCardSpeechCleanup(isActive);
  const { speak } = useSpeech();
  const useKorean = i18n.language === "ko";
  const meaningTranslations = useKorean
    ? item.meaningKoreanTranslation
    : item.meaningEnglishTranslation;
  const readingTranslations = useKorean
    ? item.readingKoreanTranslation
    : item.readingEnglishTranslation;
  const exampleTranslations = useKorean
    ? item.exampleKoreanTranslation
    : item.exampleEnglishTranslation;

  const handleSpeakKanji = React.useCallback(() => {
    if (!isActive) return;
    void speak(item.kanji, { language: "ja-JP" });
  }, [isActive, item.kanji, speak]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        { borderColor: isDark ? "#333" : "#E0E0E0" },
      ]}
    >
      <SwipeCardItemImageSection
        testID="kanji-card-image-shell"
        isDark={isDark}
        topRightOverlay={
          <SwipeCardItemAddToWordBankButton
            item={item}
            isDark={isDark}
            initialIsSaved={initialIsSaved}
            day={day}
            onSavedWordChange={onSavedWordChange}
          />
        }
      />

      <View
        testID="kanji-card-info"
        style={[
          styles.cardInfo,
          { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        ]}
      >
        <ScrollView
          testID="kanji-card-info-scroll"
          style={styles.cardInfoScroll}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.cardInfoContent}
        >
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={handleSpeakKanji} activeOpacity={0.7}>
              <Text
                style={[styles.cardTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
                numberOfLines={1}
              >
                {item.kanji}
              </Text>
            </TouchableOpacity>
            {day !== undefined && <DayBadge day={day} isDark={isDark} />}
          </View>

          <IndexedGroupSection
            title="Meanings"
            values={item.meaning}
            examples={item.meaningExample}
            hurigana={item.meaningExampleHurigana}
            translations={meaningTranslations}
            isDark={isDark}
            isActive={isActive}
            speakLanguage="ja-JP"
          />

          <IndexedGroupSection
            title="Readings"
            values={item.reading}
            examples={item.readingExample}
            hurigana={item.readingExampleHurigana}
            translations={readingTranslations}
            isDark={isDark}
            isActive={isActive}
            speakLanguage="ja-JP"
          />

          <GeneralExamples
            word={item}
            translations={exampleTranslations}
            isDark={isDark}
            isActive={isActive}
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
  cardInfoScroll: {
    flex: 1,
  },
  cardInfoContent: {
    padding: 24,
    paddingBottom: 32,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a1a",
    flexShrink: 1,
  },
  section: {
    marginTop: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  group: {
    gap: 4,
    marginTop: 4,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  example: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    lineHeight: 20,
  },
  hurigana: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 16,
  },
  translation: {
    fontSize: 15,
    fontWeight: "500",
    borderLeftWidth: 4,
    paddingLeft: 12,
    lineHeight: 21,
  },
});
