import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
import { stripKanaParens } from "../../src/utils/japaneseText";
import { formatSynonyms } from "../../src/utils/synonyms";
import { blackCardColors } from "../course/vocabulary/blackCardStyles";
import { LineHeights } from "@/constants/lineHeights";

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
  isDark: _isDark,
  isActive = true,
}: SwipeCardItemExampleSentenceSectionProps) {
  const { t } = useTranslation();
  useCardSpeechCleanup(isActive);
  const { speak } = useSpeech();

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

  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = examples.length >= 4;
  const displayedExamples =
    shouldCollapse && !isExpanded ? examples.slice(0, 3) : examples;

  const handleSpeak = React.useCallback(async (text: string) => {
    if (!isActive) {
      return;
    }
    await speak(text, { language: "en-US" });
  }, [isActive, speak]);

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
        {displayedExamples.map((exampleText, index) => (
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
                  { color: blackCardColors.primary },
                ]}
                numberOfLines={2}
              >
                {exampleText.trim()}
              </Text>
            </TouchableOpacity>
            {/* Translation */}
            {translations[index] && (
              <Text
                style={[
                  styles.cardTranslation,
                  { color: blackCardColors.muted },
                ]}
                numberOfLines={2}
              >
                {translations[index].trim()}
              </Text>
            )}
          </View>
        ))}
        {formattedSynonyms ? (
          <View testID="swipe-card-synonyms-section" style={styles.exampleGroup}>
            <Text
              style={[
                styles.sectionLabel,
                { color: blackCardColors.muted },
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
                { color: blackCardColors.secondary },
              ]}
              numberOfLines={2}
            >
              {formattedSynonyms}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {shouldCollapse && (
        <TouchableOpacity
          style={[
            styles.expandButton,
            { backgroundColor: "rgba(255,255,255,0.08)" },
          ]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text
            style={[
              styles.expandButtonText,
              { color: blackCardColors.primary },
            ]}
          >
            {isExpanded ? "Show less" : `Show ${examples.length - 3} more`}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={blackCardColors.primary}
          />
        </TouchableOpacity>
      )}
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
    color: blackCardColors.muted,
  },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardExample: {
    fontSize: FontSizes.titleMd,
    fontWeight: "600",
    color: blackCardColors.primary,
    lineHeight: LineHeights.headingMd,
  },
  cardTranslation: {
    fontSize: FontSizes.bodyMd,
    color: blackCardColors.muted,
    fontWeight: "500",
    marginTop: 2,
    lineHeight: LineHeights.titleLg,
  },
  cardSynonyms: {
    fontSize: FontSizes.bodyMd,
    fontWeight: "500",
    lineHeight: LineHeights.titleLg,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    gap: 4,
  },
  expandButtonText: {
    fontSize: FontSizes.label,
    fontWeight: "600",
  },
});
