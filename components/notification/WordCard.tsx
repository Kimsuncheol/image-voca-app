import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleProp, StyleSheet, TextStyle, View } from "react-native";
import { Card, Divider, Text } from "react-native-paper";
import { ImagePlaceholder } from "../common/ImagePlaceholder";
import { SpeakerButton } from "../CollocationFlipCard/SpeakerButton";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import type { NotificationWordCardPayload } from "../../src/types/notificationCard";
import { getIdiomTitleFontSize } from "../../src/utils/idiomDisplay";
import { resolveVocabularyContent } from "../../src/utils/localizedVocabulary";
import { formatSynonyms } from "../../src/utils/synonyms";

interface WordCardProps {
  data: Pick<
    NotificationWordCardPayload,
    | "word"
    | "meaning"
    | "pronunciation"
    | "example"
    | "translation"
    | "synonyms"
    | "imageUrl"
    | "localized"
    | "course"
  >;
  isDark?: boolean;
  onReady?: () => void;
}

interface SectionRowProps {
  label: string;
  value?: string;
  isDark: boolean;
  multiline?: boolean;
  valueStyle?: StyleProp<TextStyle>;
  valueTestID?: string;
}

function SectionRow({
  label,
  value,
  isDark,
  multiline = false,
  valueStyle,
  valueTestID,
}: SectionRowProps) {
  if (!value?.trim()) return null;

  return (
    <View style={styles.section}>
      <Text
        variant="labelMedium"
        style={[styles.sectionLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}
      >
        {label}
      </Text>
      <Text
        testID={valueTestID}
        variant="bodyLarge"
        style={[
          styles.sectionValue,
          multiline && styles.sectionValueMultiline,
          { color: isDark ? "#F9FAFB" : "#111827" },
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function WordCard({
  data,
  isDark = false,
  onReady,
}: WordCardProps) {
  const { t, i18n } = useTranslation();
  useCardSpeechCleanup();
  const resolved = React.useMemo(
    () => resolveVocabularyContent(data, i18n.language),
    [data, i18n.language],
  );

  React.useEffect(() => {
    if (!resolved.imageUrl) onReady?.();
  }, [resolved.imageUrl, onReady]);

  const formattedSynonyms =
    data.course === "TOEFL_IELTS" ? formatSynonyms(data.synonyms) : undefined;
  const titleFontSize = React.useMemo(
    () => getIdiomTitleFontSize(resolved.word, data.course, 28),
    [data.course, resolved.word],
  );
  const titleLineHeight = React.useMemo(
    () => Math.round(titleFontSize * 1.18),
    [titleFontSize],
  );

  return (
    <Card
      mode="elevated"
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#15171A" : "#FFFFFF",
        },
      ]}
    >
      <Card.Content style={styles.content}>
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <View style={styles.wordRow}>
              <Text
                testID="notification-word-title"
                variant="headlineMedium"
                style={[
                  styles.word,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                  { fontSize: titleFontSize, lineHeight: titleLineHeight },
                ]}
              >
                {resolved.word}
              </Text>
              <SpeakerButton text={resolved.word} isDark={isDark ?? false} />
            </View>
            {resolved.sharedPronunciation ? (
              <Text
                variant="bodyMedium"
                style={[
                  styles.sharedPronunciation,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {resolved.sharedPronunciation}
              </Text>
            ) : null}
            <InlineMeaningWithChips
              meaning={resolved.meaning}
              courseId={data.course}
              isDark={isDark}
              textStyle={[
                styles.meaning,
                { color: isDark ? "#BFDBFE" : "#1D4ED8" },
              ]}
              containerStyle={styles.inlineMeaning}
              chipStyle={styles.inlineChip}
              testID="inline-meaning"
            />
          </View>

          {resolved.imageUrl ? (
            <Image
              source={{ uri: resolved.imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              onLoad={onReady}
              onError={onReady}
            />
          ) : (
            <ImagePlaceholder isDark={isDark} style={styles.cardImage} />
          )}
        </View>

        <Divider style={styles.divider} />

        <SectionRow
          label={t("notifications.labels.example", { defaultValue: "Example" })}
          value={resolved.example}
          isDark={isDark}
          multiline={true}
        />
        <SectionRow
          label={t("notifications.labels.translation", {
            defaultValue: "Translation",
          })}
          value={resolved.translation}
          isDark={isDark}
          multiline={true}
        />
        <SectionRow
          label={t("notifications.labels.synonyms", {
            defaultValue: "Synonyms",
          })}
          value={formattedSynonyms}
          isDark={isDark}
          multiline={true}
          valueTestID="notification-word-card-synonyms"
          valueStyle={[
            styles.synonymValue,
            { color: isDark ? "#E5E7EB" : "#0F172A" },
          ]}
        />
        <SectionRow
          label={t("notifications.labels.pronunciation", {
            defaultValue: "Pronunciation",
          })}
          value={
            resolved.localizedPronunciation !== resolved.sharedPronunciation
              ? resolved.localizedPronunciation
              : undefined
          }
          isDark={isDark}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "90%",
    borderRadius: 20,
    marginTop: 18,
    marginBottom: 20,
  },
  content: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroLeft: {
    flex: 1,
    gap: 6,
  },
  cardImage: {
    width: 90,
    aspectRatio: 1,
    borderRadius: 8,
  },
  inlineMeaning: {
    gap: 6,
  },
  inlineChip: {
    marginRight: 6,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  word: {
    fontWeight: "800",
  },
  meaning: {
    fontWeight: "700",
    lineHeight: 24,
  },
  sharedPronunciation: {
    marginTop: 2,
    fontStyle: "italic",
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sectionValue: {
    lineHeight: 22,
  },
  sectionValueMultiline: {
    lineHeight: 24,
  },
  synonymValue: {
    fontSize: 15,
    lineHeight: 21,
  },
});
