import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TopInstallNativeAd } from "../components/ads/TopInstallNativeAd";
import { ElementaryHeroCard } from "../components/elementary-japanese/ElementaryHeroCard";
import { ElementaryModuleList } from "../components/elementary-japanese/ElementaryModuleList";
import { useTheme } from "../src/context/ThemeContext";

export default function ElementaryJapaneseScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const bg = isDark ? "#000" : "#f2f2f7";

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

      <TopInstallNativeAd containerStyle={styles.topInstallAd} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ElementaryHeroCard
          title={t("elementaryJapanese.title", {
            defaultValue: "Elementary Japanese",
          })}
          subtitle={t("elementaryJapanese.subtitle", {
            defaultValue: "Start with characters and core building blocks",
          })}
          isDark={isDark}
        />

        <ElementaryModuleList isDark={isDark} />
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
    gap: 16,
  },
  topInstallAd: {
    marginHorizontal: 0,
    marginBottom: 16,
    overflow: "hidden",
  },
});
