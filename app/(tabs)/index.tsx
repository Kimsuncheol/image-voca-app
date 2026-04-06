import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";

import {
  DashboardHeader,
  DashboardPopFamousQuote,
  DashboardPopQuiz,
  DashboardStats,
} from "../../components/dashboard";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useDashboardSettingsStore } from "../../src/stores/dashboardSettingsStore";
import { useUserStatsStore } from "../../src/stores";

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { t } = useTranslation();

  const {
    stats,
    fetchStats,
    streakBrokenAt,
    clearStreakBroken,
  } = useUserStatsStore();

  const { quizEnabled, famousQuoteEnabled, elementOrder, loadSettings } =
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

  const statsElement = (
    <DashboardStats
      key="stats"
      streak={stats?.currentStreak || 0}
      onCalendarPress={() => router.push("/calendar")}
    />
  );

  const elementMap: Record<string, React.ReactNode> = {
    quiz: quizEnabled ? <DashboardPopQuiz key="quiz" /> : null,
    famousQuote: famousQuoteEnabled ? <DashboardPopFamousQuote key="famousQuote" /> : null,
    stats: statsElement,
  };

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
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
            <ThemedText style={styles.streakBrokenText}>
              {t("streak.broken.banner", { streak: streakBrokenAt })}
            </ThemedText>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        {elementOrder.map((id) => elementMap[id])}
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
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  streakBrokenText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
