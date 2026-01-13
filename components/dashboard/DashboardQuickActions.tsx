import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { QuickAction } from "./QuickAction";

export function DashboardQuickActions() {
  const router = useRouter();
  const { t } = useTranslation();

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
          onPress={() => router.push("/(tabs)/swipe")}
        />
        <QuickAction
          title={t("dashboard.quickActions.wordBank")}
          icon="folder.fill"
          color="#4ECDC4"
          onPress={() => router.push("/wordbank")}
        />
        <QuickAction
          title={t("dashboard.quickActions.review")}
          icon="star.fill"
          color="#FFE66D"
          onPress={() => router.push("/review")}
        />
        <QuickAction
          title={t("dashboard.quickActions.settings")}
          icon="gearshape.fill"
          color="#95E1D3"
          onPress={() => router.push("/(tabs)/settings")}
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
