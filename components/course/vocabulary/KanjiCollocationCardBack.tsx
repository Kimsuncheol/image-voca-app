import React from "react";
import { View, Text, Pressable, ScrollView, TouchableOpacity } from "react-native";
import type { KanjiWord } from "../../../src/types/vocabulary";
import {
  getLocalizedKanjiMeanings,
  getLocalizedKanjiReadings,
} from "../../../src/utils/kanjiLocalization";
import { styles } from "./KanjiCollocationCardStyles";
import { BackSection } from "./KanjiCollocationCardBackSection";
import { GeneralBackSection } from "./KanjiCollocationCardGeneralBackSection";
import { DottedDivider } from "./KanjiCollocationCardDivider";

const PARENS_REGEX = /[（(][^()（）]*[）)]/g;

const stripBackSideParens = (value: string) =>
  value.replace(PARENS_REGEX, "").replace(/\s{2,}/g, " ").trim();

const sanitizeBackSideValues = (values: string[], language?: string) => {
  const normalizedLanguage = language?.split("-")[0];
  if (normalizedLanguage !== "ko" && normalizedLanguage !== "en") {
    return values;
  }
  return values.map((value) => stripBackSideParens(value));
};

/**
 * Props passed to the back face component of the Kanji Collocation Card.
 */
export interface BackSideProps {
  /** The specific vocabulary word (Kanji) object containing meaning/reading details */
  item: KanjiWord;
  /** Whether dark mode is enabled */
  isDark: boolean;
  /** Whether the card is currently active/visible on the screen to process TTS operations */
  isActive: boolean;
  /** Current app language used to choose localized meaning/reading labels */
  language?: string;
  /** Whether the user speaks Korean. Used to toggle dynamically between Korean/English translations. */
  useKorean: boolean;
  /** Callback triggered to flip the card horizontally back to the front face */
  onFlip: () => void;
}

/**
 * BackSide
 * 
 * The back face of the FlipCard component. It contains a scrollable view displaying
 * detailed collocations, grouped meanings, readings, Japanese usages, and example sentences.
 * It also holds the "がな" (Furigana) toggle button to show or hide reading aids.
 */
export function BackSide({ item, isDark, isActive, language, useKorean, onFlip }: BackSideProps) {
  const meanings = sanitizeBackSideValues(
    getLocalizedKanjiMeanings(item, language),
    language,
  );
  const readings = sanitizeBackSideValues(
    getLocalizedKanjiReadings(item, language),
    language,
  );
  const meaningTranslations = useKorean ? item.meaningKoreanTranslation : item.meaningEnglishTranslation;
  const readingTranslations = useKorean ? item.readingKoreanTranslation : item.readingEnglishTranslation;
  const exampleTranslations = useKorean ? item.exampleKoreanTranslation : item.exampleEnglishTranslation;
  const hasMeaningSection = meanings.some((value) => value.trim().length > 0);
  const hasReadingSection = readings.some((value) => value.trim().length > 0);
  const hasExampleSection = item.example.some((value) => value.trim().length > 0);

  const [showFurigana, setShowFurigana] = React.useState(false);

  React.useEffect(() => {
    if (!isActive) setShowFurigana(false);
  }, [isActive]);

  return (
    <Pressable
      testID="kanji-collocation-back-side"
      style={[styles.back, { backgroundColor: isDark ? "#1a1a1a" : "#fff", borderColor: isDark ? "#333" : "#E0E0E0" }]}
      onPress={onFlip}
    >
      <View style={styles.backHeader}>
        <TouchableOpacity
          onPress={() => setShowFurigana((v) => !v)}
          activeOpacity={0.7}
          style={[
            styles.furiganaButton,
            showFurigana
              ? { backgroundColor: "#2EA043" }
              : {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(17,24,28,0.16)",
                  borderWidth: 1,
                },
          ]}
        >
          <Text style={[styles.furiganaButtonText, { color: showFurigana ? "#fff" : isDark ? "#aaa" : "#666" }]}>
            がな
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.backScroll}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <Pressable
          testID="kanji-collocation-back-scroll-background"
          onPress={onFlip}
          style={styles.backScrollContent}
        >
          <View
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => true}
          >
            {hasMeaningSection ? (
              <BackSection
                title="MEANING"
                values={meanings}
                examples={item.meaningExample}
                hurigana={item.meaningExampleHurigana}
                translations={meaningTranslations}
                isDark={isDark}
                isActive={isActive}
                showFurigana={showFurigana}
              />
            ) : null}
            {hasMeaningSection && hasReadingSection ? (
              <DottedDivider
                isDark={isDark}
                testID="kanji-collocation-divider-meaning-reading"
              />
            ) : null}
            {hasReadingSection ? (
              <BackSection
                title="READING"
                values={readings}
                examples={item.readingExample}
                hurigana={item.readingExampleHurigana}
                translations={readingTranslations}
                isDark={isDark}
                isActive={isActive}
                showFurigana={showFurigana}
              />
            ) : null}
            {hasReadingSection && hasExampleSection ? (
              <DottedDivider
                isDark={isDark}
                testID="kanji-collocation-divider-reading-example"
              />
            ) : null}
            {hasExampleSection ? (
              <GeneralBackSection
                examples={item.example}
                hurigana={item.exampleHurigana}
                translations={exampleTranslations}
                isDark={isDark}
                isActive={isActive}
                showFurigana={showFurigana}
              />
            ) : null}
          </View>
        </Pressable>
      </ScrollView>
    </Pressable>
  );
}
