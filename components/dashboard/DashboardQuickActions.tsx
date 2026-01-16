import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTabLayout } from "../../src/context/TabLayoutContext";
import { ThemedText } from "../themed-text";
import { QuickAction } from "./QuickAction";

export function DashboardQuickActions() {
  const router = useRouter();
  const { t } = useTranslation();
  const tabLayout = useTabLayout();

  const handleTabAction = (key: string, href: string) => {
    if (tabLayout) {
      tabLayout.goToTab(key);
      return;
    }
    router.push(href);
  };

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.quickActions.title")}
      </ThemedText>
      <View style={styles.quickActions}>
        <QuickAction
          title={t("dashboard.quickActions.vocabulary")}
          icon="book.fill"
          color="#FF6B6B"
          onPress={() => handleTabAction("voca", "/(tabs)/swipe")}
        />
        <QuickAction
          title={t("dashboard.quickActions.wordBank")}
          icon="folder.fill"
          color="#4ECDC4"
          onPress={() => handleTabAction("wordbank", "/(tabs)/wordbank")}
        />
        <QuickAction
          title={t("dashboard.quickActions.speaking")}
          icon="mic.fill"
          color="#87CEEB"
          onPress={() => handleTabAction("speaking", "/speaking")}
        />
        <QuickAction
          title={t("dashboard.quickActions.settings")}
          icon="gearshape.fill"
          color="#95E1D3"
          onPress={() => handleTabAction("settings", "/(tabs)/settings")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
