import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";
import { FontSizes } from "@/constants/fontSizes";

import {
  DashboardHeader,
  DashboardPopFamousQuote,
  DashboardStats,
} from "../../components/dashboard";
import { BackgroundColors, getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  useDashboardSettingsStore,
  type DashboardElement,
} from "../../src/stores/dashboardSettingsStore";
import { useUserStatsStore } from "../../src/stores";

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const fontColors = getFontColors(isDark);
  const bgColors = getBackgroundColors(isDark);
  const { user } = useAuth();

  const { t } = useTranslation();

  const router = useRouter();

  const {
    stats,
    fetchStats,
    streakBrokenAt,
    clearStreakBroken,
    getTodayProgress,
  } = useUserStatsStore();

  const { famousQuoteEnabled, elementOrder, loadSettings } =
    useDashboardSettingsStore();

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      if (user) {
        fetchStats(user.uid);
      }
    }, [user, fetchStats, loadSettings]),
  );

  const userName = user?.displayName || user?.email?.split("@")[0] || undefined;

  const elementMap: Record<DashboardElement, React.ReactNode> = {
    famousQuote: famousQuoteEnabled ? (
      <DashboardPopFamousQuote key="famousQuote" />
    ) : null,
  };

  return (
    <View
      style={[styles.container, { backgroundColor: bgColors.screen }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader userName={userName} userPhoto={user?.photoURL} />
        {streakBrokenAt !== null && (
          <TouchableOpacity
            style={styles.streakBrokenBanner}
            onPress={clearStreakBroken}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.streakBrokenText,
                { color: fontColors.buttonOnAccent },
              ]}
            >
              {t("streak.broken.banner", { streak: streakBrokenAt })}
            </ThemedText>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        {elementOrder.map((id) => elementMap[id])}
        <DashboardStats
          streak={stats?.currentStreak ?? 0}
          todayLearned={getTodayProgress().current}
          onCalendarPress={() => router.push("/calendar")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  streakBrokenBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BackgroundColors.light.accentRed,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  streakBrokenText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontWeight: "600",
  },
});
