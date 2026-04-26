import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountersTabs } from "../components/counters/CountersTabs";
import { ThemedText } from "../components/themed-text";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import type { CounterTabId } from "../src/types/counters";
import { FontSizes } from "@/constants/fontSizes";

export default function CountersScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const fontColors = getFontColors(isDark);

  const bgColors = getBackgroundColors(isDark);
  const bg = bgColors.screenAlt;
  const heroCardBg = bgColors.heroCardPanel;
  const accentBg = bgColors.countersAccentBg;
  const accentText = fontColors.countersAccentText;
  const subtitleColor = fontColors.heroSubtitle;
  const sectionLabelColor = fontColors.sectionLabelSoft;

  const handleSelect = (tab: CounterTabId) => {
    router.push({
      pathname: "/counter-category",
      params: { tab },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: t("counters.title"),
          headerBackTitle: t("common.back"),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: heroCardBg }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.accentPill, { backgroundColor: accentBg }]}>
              <ThemedText
                style={[styles.accentPillText, { color: accentText }]}
              >
                {t("elementaryJapanese.title", {
                  defaultValue: "Elementary Japanese",
                })}
              </ThemedText>
            </View>
            <View style={styles.heroDots}>
              <View
                style={[
                  styles.heroDotLarge,
                  { backgroundColor: bgColors.countersStatCard1 },
                ]}
              />
              <View
                style={[
                  styles.heroDotSmall,
                  { backgroundColor: bgColors.countersStatCard2 },
                ]}
              />
            </View>
          </View>

          <View style={styles.heroTextGroup}>
            <ThemedText type="title">
              {t("counters.title", { defaultValue: "Counters" })}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
              {t("counters.subtitle", {
                defaultValue:
                  "Browse essential Japanese counter groups and open the one you need in a tap.",
              })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText
            style={[styles.sectionLabel, { color: sectionLabelColor }]}
          >
            {t("counters.gridLabel", {
              defaultValue: "Counter groups",
            })}
          </ThemedText>
        </View>

        <CountersTabs onSelect={handleSelect} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 12,
    gap: 18,
    padding: 20,
  },
  heroTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accentPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  accentPillText: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
  },
  heroDots: {
    alignItems: "flex-end",
    gap: 8,
    minWidth: 44,
  },
  heroDotLarge: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  heroDotSmall: {
    borderRadius: 999,
    height: 8,
    width: 28,
  },
  heroTextGroup: {
    gap: 10,
  },
  subtitle: {
    fontSize: FontSizes.bodyMd,
    lineHeight: 22,
    maxWidth: "92%",
  },
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
