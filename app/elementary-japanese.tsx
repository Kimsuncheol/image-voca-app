import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "../components/themed-text";
import { useTheme } from "../src/context/ThemeContext";

type ModuleCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDark: boolean;
};

function ModuleCard({
  title,
  description,
  icon,
  onPress,
  isDark,
}: ModuleCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconShell,
            { backgroundColor: isDark ? "#2c2c2e" : "#ffffff" },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={isDark ? "#fff" : "#111827"}
          />
        </View>
        <View style={styles.textGroup}>
          <ThemedText style={styles.cardTitle}>{title}</ThemedText>
          <ThemedText style={styles.cardDescription}>{description}</ThemedText>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
      />
    </TouchableOpacity>
  );
}

export default function ElementaryJapaneseScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const bg = isDark ? "#000" : "#f2f2f7";
  const heroCardBg = isDark ? "#121318" : "#ffffff";
  const accentBg = isDark ? "#1f2f4c" : "#dbeafe";
  const accentText = isDark ? "#c6dbff" : "#1d4ed8";
  const subtitleColor = isDark
    ? "rgba(255,255,255,0.66)"
    : "rgba(17,24,39,0.65)";
  const sectionLabelColor = isDark
    ? "rgba(255,255,255,0.54)"
    : "rgba(17,24,39,0.5)";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: t("elementaryJapanese.title", {
            defaultValue: "Elementary Japanese",
          }),
          headerBackTitle: t("common.back"),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: heroCardBg }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.accentPill, { backgroundColor: accentBg }]}>
              <ThemedText style={[styles.accentPillText, { color: accentText }]}>
                {t("elementaryJapanese.title", {
                  defaultValue: "Elementary Japanese",
                })}
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
            <ThemedText type="title">
              {t("elementaryJapanese.title", {
                defaultValue: "Elementary Japanese",
              })}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
              {t("elementaryJapanese.subtitle", {
                defaultValue: "Start with characters and core building blocks",
              })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionLabel, { color: sectionLabelColor }]}>
            {t("elementaryJapanese.title", {
              defaultValue: "Elementary Japanese",
            })}
          </ThemedText>
        </View>

        <View style={styles.list}>
          <ModuleCard
            title={t("kana.title", { defaultValue: "Hiragana & Katakana" })}
            description={t("elementaryJapanese.modules.kana.description", {
              defaultValue: "Learn the Japanese character systems and practice recognition.",
            })}
            icon="language-outline"
            onPress={() => router.push("/japanese-characters")}
            isDark={isDark}
          />
          <ModuleCard
            title={t("prefixPostfix.title", { defaultValue: "Prefix & Postfix" })}
            description={t("elementaryJapanese.modules.prefixPostfix.description", {
              defaultValue: "Study common Japanese prefixes and suffixes.",
            })}
            icon="text-outline"
            onPress={() => router.push("/prefix-postfix")}
            isDark={isDark}
          />
          <ModuleCard
            title={t("counters.title", { defaultValue: "Counters" })}
            description={t("elementaryJapanese.modules.counters.description", {
              defaultValue: "Browse Japanese counters by category with examples.",
            })}
            icon="albums-outline"
            onPress={() => router.push("/counters")}
            isDark={isDark}
          />
          <ModuleCard
            title={t("greetings.title", { defaultValue: "Greetings" })}
            description={t("elementaryJapanese.modules.greeting.description", {
              defaultValue: "Study essential Japanese greetings used in daily conversation.",
            })}
            icon="chatbubble-ellipses-outline"
            onPress={() => router.push("/japanese-greetings" as never)}
            isDark={isDark}
          />
        </View>
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
    fontSize: 12,
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
    fontSize: 15,
    lineHeight: 22,
    maxWidth: "92%",
  },
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  iconShell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
  },
});
