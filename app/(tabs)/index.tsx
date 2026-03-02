import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

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

  const {
    stats,
    fetchStats,
    getWordsLearnedForPeriod,
    getAccuracyForPeriod,
    getTimeSpentForPeriod,
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

  const wordsThisWeek = getWordsLearnedForPeriod(7);
  const accuracyThisWeek = getAccuracyForPeriod(7);
  const timeThisWeek = getTimeSpentForPeriod(7);

  const userName = user?.displayName || user?.email?.split("@")[0] || undefined;

  const statsElement = (
    <DashboardStats
      key="stats"
      wordsLearned={wordsThisWeek}
      streak={stats?.currentStreak || 0}
      accuracy={accuracyThisWeek}
      timeSpent={timeThisWeek}
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
});
