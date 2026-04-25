import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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
import { useSpeech } from "../../src/hooks/useSpeech";
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
  useCardSpeechCleanup(isActive);
  const { speak } = useSpeech();
  const fontColors = getFontColors(isDark);

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
        <Text
          style={[
            styles.metaText,
            { color: isDark ? "#b0b0b0" : "#5c5c5c" },
          ]}
        >
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
                  { color: isDark ? "#b0b0b0" : "#444" },
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
                  { color: fontColors.translation },
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
                { color: isDark ? "#b0b0b0" : "#5c5c5c" },
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
                { color: isDark ? "#9A9A9A" : "#2F2F2F" },
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
            { backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5" },
          ]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text
            style={[
              styles.expandButtonText,
              { color: isDark ? "#0a84ff" : "#007AFF" },
            ]}
          >
            {isExpanded ? "Show less" : `Show ${examples.length - 3} more`}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={isDark ? "#0a84ff" : "#007AFF"}
          />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  examplesScrollContainer: {
    maxHeight: 200,
    marginTop: 4,
  },
  exampleGroup: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardExample: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    lineHeight: 20,
  },
  cardTranslation: {
    fontSize: 12,
    color: "#2d5f2d",
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 22,
  },
  cardSynonyms: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
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
    fontSize: 13,
    fontWeight: "600",
  },
});
