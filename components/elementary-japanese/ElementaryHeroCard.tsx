import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";

type ElementaryHeroCardProps = {
  title: string;
  subtitle: string;
  isDark: boolean;
};

export function ElementaryHeroCard({
  title,
  subtitle,
  isDark,
}: ElementaryHeroCardProps) {
  const heroCardBg = isDark ? "#121318" : "#ffffff";
  const accentBg = isDark ? "#1f2f4c" : "#dbeafe";
  const accentText = isDark ? "#c6dbff" : "#1d4ed8";
  const subtitleColor = isDark
    ? "rgba(255,255,255,0.66)"
    : "rgba(17,24,39,0.65)";

  return (
    <View style={[styles.heroCard, { backgroundColor: heroCardBg }]}>
      <View style={styles.heroTopRow}>
        <View style={[styles.accentPill, { backgroundColor: accentBg }]}>
          <ThemedText style={[styles.accentPillText, { color: accentText }]}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.heroDots}>
          <View
            style={[
              styles.heroDotLarge,
              { backgroundColor: isDark ? "#2563eb" : "#60a5fa" },
            ]}
          />
          <View
            style={[
              styles.heroDotSmall,
              { backgroundColor: isDark ? "#1d4ed8" : "#bfdbfe" },
            ]}
          />
        </View>
      </View>

      <View style={styles.heroTextGroup}>
        <ThemedText type="title">{title}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
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
    fontWeight: FontWeights.bold,
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
    lineHeight: LineHeights.titleLg,
    maxWidth: "92%",
  },
});
