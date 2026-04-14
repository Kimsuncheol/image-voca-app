import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { ElementaryModuleCard } from "./ElementaryModuleCard";

type ElementaryModuleListProps = {
  isDark: boolean;
};

export function ElementaryModuleList({ isDark }: ElementaryModuleListProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const sectionLabelColor = isDark
    ? "rgba(255,255,255,0.54)"
    : "rgba(17,24,39,0.5)";

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionLabel, { color: sectionLabelColor }]}>
          {t("elementaryJapanese.title", {
            defaultValue: "Elementary Japanese",
          })}
        </ThemedText>
      </View>

      <View style={styles.list}>
        <ElementaryModuleCard
          title={t("kana.title", { defaultValue: "Hiragana & Katakana" })}
          description={t("elementaryJapanese.modules.kana.description", {
            defaultValue: "Learn the Japanese character systems and practice recognition.",
          })}
          icon="language-outline"
          onPress={() => router.push("/japanese-characters")}
          isDark={isDark}
        />
        <ElementaryModuleCard
          title={t("prefixPostfix.title", { defaultValue: "Prefix & Postfix" })}
          description={t("elementaryJapanese.modules.prefixPostfix.description", {
            defaultValue: "Study common Japanese prefixes and suffixes.",
          })}
          icon="text-outline"
          onPress={() => router.push("/prefix-postfix")}
          isDark={isDark}
        />
        <ElementaryModuleCard
          title={t("counters.title", { defaultValue: "Counters" })}
          description={t("elementaryJapanese.modules.counters.description", {
            defaultValue: "Browse Japanese counters by category with examples.",
          })}
          icon="albums-outline"
          onPress={() => router.push("/counters")}
          isDark={isDark}
        />
        <ElementaryModuleCard
          title={t("greetings.title", { defaultValue: "Greetings" })}
          description={t("elementaryJapanese.modules.greeting.description", {
            defaultValue: "Study essential Japanese greetings used in daily conversation.",
          })}
          icon="chatbubble-ellipses-outline"
          onPress={() => router.push("/japanese-greetings" as never)}
          isDark={isDark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
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
});
