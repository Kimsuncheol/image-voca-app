import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../components/themed-text";
import { useTheme } from "../src/context/ThemeContext";
import { useSpeech } from "../src/hooks/useSpeech";
import { getCountersData } from "../src/services/countersService";
import { COUNTER_TAB_IDS } from "../src/types/counters";
import type { CounterTabId, CounterWord } from "../src/types/counters";
import { speakWordVariants } from "../src/utils/wordVariants";

const isCounterTabId = (value: string): value is CounterTabId =>
  COUNTER_TAB_IDS.includes(value as CounterTabId);

function DetailSection({
  label,
  value,
  secondaryValue,
}: {
  label: string;
  secondaryValue?: string;
  value: string;
}) {
  if (!value && !secondaryValue) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionLabel}>{label}</ThemedText>
      {value ? <ThemedText style={styles.sectionValue}>{value}</ThemedText> : null}
      {secondaryValue ? (
        <ThemedText style={styles.sectionSecondary}>{secondaryValue}</ThemedText>
      ) : null}
    </View>
  );
}

export default function CounterDetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id?: string; tab?: string }>();
  const { isDark } = useTheme();
  const { i18n, t } = useTranslation();
  const { speak } = useSpeech();

  const [counter, setCounter] = useState<CounterWord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab = useMemo<CounterTabId | null>(
    () => (tab && isCounterTabId(tab) ? tab : null),
    [tab],
  );
  const isKorean = i18n.language === "ko";

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!id || !activeTab) {
        setError(
          t("counters.detailNotFound", {
            defaultValue: "Counter details are unavailable.",
          }),
        );
        setLoading(false);
        return;
      }

      try {
        const items = await getCountersData(activeTab);
        if (!isActive) return;

        const match = items.find((item) => item.id === id) ?? null;
        setCounter(match);
        setError(
          match
            ? null
            : t("counters.detailNotFound", {
                defaultValue: "Counter details are unavailable.",
              }),
        );
      } catch (loadError) {
        if (!isActive) return;
        console.warn("Failed to load counter detail:", loadError);
        setCounter(null);
        setError(
          t("counters.loadError", {
            defaultValue: "Unable to load counters data.",
          }),
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [activeTab, id, t]);

  const handleSpeak = async () => {
    if (!counter) return;
    try {
      await speakWordVariants(counter.word, speak);
    } catch (speakError) {
      console.error("Counter detail TTS error:", speakError);
    }
  };

  const backgroundColor = isDark ? "#000" : "#f2f2f7";
  const cardBackground = isDark ? "#1c1c1e" : "#fff";
  const secondaryBackground = isDark ? "#111" : "#f5f5f5";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";
  const accent = isDark ? "#8ab4ff" : "#2563eb";

  const meaning = counter
    ? isKorean
      ? counter.meaningKorean
      : counter.meaningEnglish
    : "";
  const translation = counter
    ? isKorean
      ? counter.translationKorean
      : counter.translationEnglish
    : "";
  const tabLabel =
    activeTab != null ? t(`counters.tabs.${activeTab}`) : t("counters.title");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: counter?.word || t("counters.title"),
          headerBackTitle: t("common.back"),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.statusWrap}>
            <ThemedText style={[styles.statusText, { color: mutedText }]}>
              {t("counters.loading", { defaultValue: "Loading..." })}
            </ThemedText>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.statusWrap}>
            <ThemedText style={[styles.statusText, { color: mutedText }]}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {!loading && !error && counter ? (
          <>
            <View style={[styles.heroCard, { backgroundColor: cardBackground }]}>
              <View style={styles.heroTop}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: secondaryBackground },
                  ]}
                >
                  <ThemedText style={[styles.badgeText, { color: accent }]}>
                    {tabLabel}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={handleSpeak}
                  style={[
                    styles.speakerButton,
                    { backgroundColor: secondaryBackground },
                  ]}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="volume-medium"
                    size={18}
                    color={isDark ? "#fff" : "#111827"}
                  />
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.counterText}>{counter.word}</ThemedText>
              <ThemedText style={[styles.meaningText, { color: mutedText }]}>
                {meaning}
              </ThemedText>
            </View>

            <View
              style={[styles.detailCard, { backgroundColor: cardBackground }]}
            >
              <DetailSection
                label={t("counters.colPronun")}
                value={counter.pronunciation}
                secondaryValue={counter.pronunciationRoman}
              />
              <DetailSection
                label={t("counters.colExample")}
                value={counter.example}
                secondaryValue={translation}
              />
              <DetailSection
                label={t("counters.colMeaning")}
                value={meaning}
                secondaryValue={
                  isKorean ? counter.meaningEnglish : counter.meaningKorean
                }
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statusWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  heroCard: {
    borderRadius: 24,
    gap: 12,
    padding: 20,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  speakerButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  counterText: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
  },
  meaningText: {
    fontSize: 16,
    lineHeight: 22,
  },
  detailCard: {
    borderRadius: 24,
    padding: 20,
  },
  section: {
    gap: 6,
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.6,
    textTransform: "uppercase",
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
  },
  sectionSecondary: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
  },
});
