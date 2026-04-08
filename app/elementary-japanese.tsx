import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
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

      <View style={styles.content}>
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
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
