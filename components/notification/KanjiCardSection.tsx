import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
import {
  getLocalizedKanjiMeanings,
  getLocalizedKanjiReadings,
} from "../../src/utils/kanjiLocalization";
import {
  deserializeKanjiNotificationPayload,
  type NotificationKanjiCardPayload,
} from "../../src/types/notificationCard";
import { ImagePlaceholder } from "../common/ImagePlaceholder";
import { DottedDivider } from "../course/vocabulary/KanjiCollocationCardDivider";
import { GeneralBackSection } from "../course/vocabulary/KanjiCollocationCardGeneralBackSection";
import { compactStrings } from "../course/vocabulary/kanjiCollocationUtils";

interface KanjiCardSectionProps {
  payload: NotificationKanjiCardPayload;
  isDark: boolean;
  onReady?: () => void;
}

export default function KanjiCardSection({
  payload,
  isDark,
  onReady,
}: KanjiCardSectionProps) {
  const { speak } = useSpeech();
  useCardSpeechCleanup();
  const { i18n } = useTranslation();
  const useKorean = i18n.language === "ko";

  const [showFurigana, setShowFurigana] = React.useState(false);

  React.useEffect(() => {
    onReady?.();
  }, [onReady]);

  const data = React.useMemo(
    () => deserializeKanjiNotificationPayload(payload),
    [payload],
  );

  const meanings = compactStrings(getLocalizedKanjiMeanings(data, i18n.language));
  const readings = compactStrings(getLocalizedKanjiReadings(data, i18n.language));

  const exampleTranslations = useKorean
    ? data.exampleKoreanTranslation
    : data.exampleEnglishTranslation;

  const hasGeneralExamples = data.example.length > 0;

  const handleSpeakKanji = React.useCallback(() => {
    void speak(payload.kanji, { language: "ja-JP" });
  }, [speak, payload.kanji]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      {/* Header: kanji + image */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleSpeakKanji} activeOpacity={0.7}>
            <Text
              style={[styles.kanjiText, { color: isDark ? "#fff" : "#1a1a1a" }]}
            >
              {payload.kanji}
            </Text>
          </TouchableOpacity>
        </View>
        {payload.imageUrl ? (
          <Image
            source={{ uri: payload.imageUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <ImagePlaceholder isDark={isDark} style={styles.thumbnail} />
        )}
      </View>

      {/* Meaning chips */}
      {meanings.length > 0 && (
        <View style={styles.chipsSection}>
          <Text
            style={[styles.sectionLabel, { color: isDark ? "#999" : "#666" }]}
          >
            MEANING
          </Text>
          <View style={styles.chipRow}>
            {meanings.map((m, i) => (
              <Text
                key={`m-${i}`}
                style={[
                  styles.chipText,
                  { color: isDark ? "#e0e0e0" : "#1a1a1a" },
                ]}
              >
                {m}
                {i < meanings.length - 1 ? "," : ""}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Reading chips */}
      {readings.length > 0 && (
        <View style={styles.chipsSection}>
          <Text
            style={[styles.sectionLabel, { color: isDark ? "#999" : "#666" }]}
          >
            READING
          </Text>
          <View style={styles.chipRow}>
            {readings.map((r, i) => (
              <Text
                key={`r-${i}`}
                style={[
                  styles.chipText,
                  { color: isDark ? "#e0e0e0" : "#1a1a1a" },
                ]}
              >
                {r}
                {i < readings.length - 1 ? "," : ""}
              </Text>
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
                  ? { backgroundColor: "#2EA043" }
                  : {
                      borderColor: isDark
                        ? "rgba(255,255,255,0.22)"
                        : "rgba(17,24,28,0.16)",
                      borderWidth: 1,
                    },
              ]}
            >
              <Text
                style={[
                  styles.furiganaButtonText,
                  { color: showFurigana ? "#fff" : isDark ? "#aaa" : "#666" },
                ]}
              >
                がな
              </Text>
            </TouchableOpacity>
          </View>
          <GeneralBackSection
            examples={data.example}
            hurigana={data.exampleHurigana}
            translations={exampleTranslations}
            isDark={isDark}
            isActive={true}
            showFurigana={showFurigana}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "90%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  kanjiText: {
    fontSize: 52,
    fontWeight: "bold",
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  chipsSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
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
    fontSize: 13,
    fontWeight: "600",
  },
});
