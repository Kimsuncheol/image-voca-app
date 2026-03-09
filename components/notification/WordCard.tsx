import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Divider, Text } from "react-native-paper";
import { SpeakerButton } from "../CollocationFlipCard/SpeakerButton";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";
import type { NotificationWordCardPayload } from "../../src/types/notificationCard";

interface WordCardProps {
  data: Pick<
    NotificationWordCardPayload,
    "word" | "meaning" | "pronunciation" | "example" | "translation"
  >;
  isDark?: boolean;
}

interface SectionRowProps {
  label: string;
  value?: string;
  isDark: boolean;
  multiline?: boolean;
}

function SectionRow({
  label,
  value,
  isDark,
  multiline = false,
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
        variant="bodyLarge"
        style={[
          styles.sectionValue,
          multiline && styles.sectionValueMultiline,
          { color: isDark ? "#F9FAFB" : "#111827" },
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
}: WordCardProps) {
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
        <View style={styles.hero}>
          <View style={styles.wordRow}>
            <Text
              variant="headlineMedium"
              style={[styles.word, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
            >
              {data.word}
            </Text>
            <SpeakerButton text={data.word} isDark={isDark ?? false} />
          </View>
          <View style={styles.meaningSection}>
            <InlineMeaningWithChips
              meaning={data.meaning}
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
        </View>

        <Divider style={styles.divider} />

        <SectionRow
          label="Pronunciation"
          value={data.pronunciation}
          isDark={isDark}
        />
        <SectionRow
          label="Example"
          value={data.example}
          isDark={isDark}
          multiline={true}
        />
        <SectionRow
          label="Translation"
          value={data.translation}
          isDark={isDark}
          multiline={true}
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
  hero: {
    gap: 8,
  },
  meaningSection: {
    marginTop: 2,
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
});
