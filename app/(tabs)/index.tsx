import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  DashboardHeader,
  DashboardPopQuiz,
  DashboardQuickActions,
  DashboardStats,
} from "../../components/dashboard";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
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

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchStats(user.uid);
      }
    }, [user, fetchStats]),
  );

  const wordsThisWeek = getWordsLearnedForPeriod(7);
  const accuracyThisWeek = getAccuracyForPeriod(7);
  const timeThisWeek = getTimeSpentForPeriod(7);

  const userName = user?.displayName || user?.email?.split("@")[0] || undefined;

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader userName={userName} />
        <DashboardQuickActions />
        <DashboardPopQuiz />
        <DashboardStats
          wordsLearned={wordsThisWeek}
          streak={stats?.currentStreak || 0}
          accuracy={accuracyThisWeek}
          timeSpent={timeThisWeek}
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
});
