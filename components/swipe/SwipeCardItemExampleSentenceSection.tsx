import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getFontColors } from "../../constants/fontColors";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useStudySpeech } from "../../src/hooks/useStudyMode";
import { stripKanaParens } from "../../src/utils/japaneseText";
import { formatSynonyms } from "../../src/utils/synonyms";

interface SwipeCardItemExampleSentenceSectionProps {
  example: string;
  translation?: string;
  pronunciation?: string;
  synonyms?: string[];
  courseId: string;
  isDark: boolean;
  isActive?: boolean;
}

export function SwipeCardItemExampleSentenceSection({
  example,
  translation,
  pronunciation,
  synonyms,
  courseId,
  isDark,
  isActive = true,
}: SwipeCardItemExampleSentenceSectionProps) {
  const { t } = useTranslation();
  const fontColors = getFontColors(isDark);
  useCardSpeechCleanup(isActive);
  const { handleSpeech } = useStudySpeech();

  // Split examples and translations by newlines
  // Remove number prefixes (e.g., "1. ", "2. ") from the raw text
  const examples = example
    ? example
        .split("\n")
        .filter((e) => e.trim())
        .map((e) => e.replace(/^\d+\.\s*/, "").trim())
    : [];
  const translations = translation
    ? translation
        .split("\n")
        .filter((t) => t.trim())
        .map((t) => t.replace(/^\d+\.\s*/, "").trim())
    : [];
  const formattedSynonyms =
    courseId === "TOEFL_IELTS" ? formatSynonyms(synonyms) : undefined;

  const handleSpeak = React.useCallback(
    async (text: string) => {
      if (!isActive) {
        return;
      }
      await handleSpeech(text, "EN");
    },
    [handleSpeech, isActive],
  );

  return (
    <>
      {pronunciation ? (
        <Text style={styles.metaText}>
          {`${t("notifications.labels.pronunciation", {
            defaultValue: "Pronunciation",
          })}: ${pronunciation}`}
        </Text>
      ) : null}
      <ScrollView
        style={styles.examplesScrollContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {examples.map((exampleText, index) => (
          <View key={index} style={styles.exampleGroup}>
            {/* Example sentence */}
            <TouchableOpacity
              onPress={() => {
                void handleSpeak(stripKanaParens(exampleText.trim()));
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cardExample,
                  { color: fontColors.learningCardPrimary },
                ]}
              >
                {exampleText.trim()}
              </Text>
            </TouchableOpacity>
            {/* Translation */}
            {translations[index] && (
              <Text
                style={[
                  styles.cardTranslation,
                  { color: fontColors.learningCardMuted },
                ]}
              >
                {translations[index].trim()}
              </Text>
            )}
          </View>
        ))}
        {formattedSynonyms ? (
          <View
            testID="swipe-card-synonyms-section"
            style={styles.exampleGroup}
          >
            <Text
              style={[
                styles.sectionLabel,
                { color: fontColors.learningCardMuted },
              ]}
            >
              {t("notifications.labels.synonyms", {
                defaultValue: "Synonyms",
              })}
            </Text>
            <Text
              testID="swipe-card-synonyms"
              style={[
                styles.cardSynonyms,
                { color: fontColors.learningCardSecondary },
              ]}
              numberOfLines={2}
            >
              {formattedSynonyms}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  examplesScrollContainer: {
    maxHeight: 190,
    marginTop: 2,
  },
  exampleGroup: {
    marginTop: 14,
  },
  metaText: {
    fontSize: FontSizes.body,
    lineHeight: LineHeights.bodyLg,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: "uppercase",
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
  cardSynonyms: {
    fontSize: FontSizes.bodyMd,
    fontWeight: FontWeights.semiBold,
    lineHeight: LineHeights.titleLg,
  },
});
