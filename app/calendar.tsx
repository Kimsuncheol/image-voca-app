import { useFocusEffect } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CalendarDayDetailCard } from "../components/calendar/CalendarDayDetailCard";
import { CalendarMonthGrid } from "../components/calendar/CalendarMonthGrid";
import { CalendarMonthSummaryCard } from "../components/calendar/CalendarMonthSummaryCard";
import { ThemedText } from "../components/themed-text";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { useUserStatsStore } from "../src/stores";
import {
  addMonths,
  buildCalendarMonth,
  buildDailyStatsLookup,
  buildMonthSummary,
  formatDateKey,
  getMonthPreferredSelectedDate,
  parseDateKey,
  startOfMonth,
} from "../src/utils/calendarStats";

const buildWeekdayLabels = (language: string) => {
  const base = new Date(2026, 3, 5);
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(language, { weekday: "narrow" }).format(
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + index),
    ),
  );
};

export default function CalendarScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { stats, loading, fetchStats } = useUserStatsStore();
  const [visibleMonth, setVisibleMonth] = React.useState(() => startOfMonth(new Date()));
  const todayKey = React.useMemo(() => formatDateKey(new Date()), []);
  const dailyStatsByDate = React.useMemo(
    () => buildDailyStatsLookup(stats?.dailyStats ?? []),
    [stats?.dailyStats],
  );
  const [selectedDateKey, setSelectedDateKey] = React.useState(todayKey);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        void fetchStats(user.uid);
      }
    }, [fetchStats, user]),
  );

  React.useEffect(() => {
    setSelectedDateKey(
      getMonthPreferredSelectedDate(visibleMonth, dailyStatsByDate, todayKey),
    );
  }, [dailyStatsByDate, todayKey, visibleMonth]);

  const monthLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: "long",
        year: "numeric",
      }).format(visibleMonth),
    [i18n.language, visibleMonth],
  );

  const detailTitle = React.useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(parseDateKey(selectedDateKey)),
    [i18n.language, selectedDateKey],
  );

  const weekdayLabels = React.useMemo(
    () => buildWeekdayLabels(i18n.language),
    [i18n.language],
  );

  const monthSummary = React.useMemo(
    () => buildMonthSummary(visibleMonth, dailyStatsByDate),
    [dailyStatsByDate, visibleMonth],
  );

  const cells = React.useMemo(
    () =>
      buildCalendarMonth({
        monthStart: visibleMonth,
        selectedDateKey,
        todayKey,
        dailyStatsByDate,
        currentStreak: stats?.currentStreak ?? 0,
        lastActiveDate: stats?.lastActiveDate,
      }),
    [
      dailyStatsByDate,
      selectedDateKey,
      stats?.currentStreak,
      stats?.lastActiveDate,
      todayKey,
      visibleMonth,
    ],
  );

  const selectedCell = React.useMemo(
    () => cells.find((cell) => cell.dateKey === selectedDateKey),
    [cells, selectedDateKey],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            {t("calendar.title")}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {loading ? t("calendar.loading") : t("calendar.subtitle")}
          </ThemedText>
        </View>

        <CalendarMonthSummaryCard
          summary={monthSummary}
          currentStreak={stats?.currentStreak ?? 0}
        />

        <CalendarMonthGrid
          monthLabel={monthLabel}
          weekdayLabels={weekdayLabels}
          cells={cells}
          onPreviousMonth={() => setVisibleMonth((current) => addMonths(current, -1))}
          onNextMonth={() => setVisibleMonth((current) => addMonths(current, 1))}
          onSelectDate={setSelectedDateKey}
        />

        <CalendarDayDetailCard
          title={detailTitle}
          stats={selectedCell?.stats}
          contributedToStreak={selectedCell?.contributedToStreak ?? false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    lineHeight: 34,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    opacity: 0.68,
  },
});
