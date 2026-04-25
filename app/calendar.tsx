import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopInstallNativeAd } from "../components/ads/TopInstallNativeAd";
import { CalendarChart } from "../components/calendar/CalendarChart";
import { CalendarDayDetailCard } from "../components/calendar/CalendarDayDetailCard";
import { CalendarMonthGrid } from "../components/calendar/CalendarMonthGrid";
import { CalendarMonthSummaryCard } from "../components/calendar/CalendarMonthSummaryCard";

import { useAuth } from "../src/context/AuthContext";
import { getBackgroundColors } from "../constants/backgroundColors";
import { useTheme } from "../src/context/ThemeContext";
import {
  VocabularyDayStudyEntry,
  fetchDailyStudyHistory,
} from "../src/services/dailyStudyHistory";
import { useUserStatsStore } from "../src/stores";
import {
  addMonths,
  buildCalendarMonth,
  buildDailyStatsLookup,
  buildMonthSummary,
  formatDateKey,
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
  const bgColors = getBackgroundColors(isDark);
  const { user } = useAuth();
  const userId = user?.uid;
  const router = useRouter();
  const { i18n } = useTranslation();
  const { stats, fetchStats } = useUserStatsStore();
  const [visibleMonth, setVisibleMonth] = React.useState(() => startOfMonth(new Date()));
  const todayKey = React.useMemo(() => formatDateKey(new Date()), []);
  const dailyStatsByDate = React.useMemo(
    () => buildDailyStatsLookup(stats?.dailyStats ?? []),
    [stats?.dailyStats],
  );
  const [selectedDateKey, setSelectedDateKey] = React.useState(todayKey);
  const [historyByDate, setHistoryByDate] = React.useState<
    Record<string, VocabularyDayStudyEntry[]>
  >({});
  const [historyLoadingByDate, setHistoryLoadingByDate] = React.useState<
    Record<string, boolean>
  >({});

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        void fetchStats(userId);
      }
    }, [fetchStats, userId]),
  );

  React.useEffect(() => {
    setHistoryByDate({});
    setHistoryLoadingByDate({});
  }, [user?.uid]);



  const selectedHistory = historyByDate[selectedDateKey];
  const selectedHistoryLoading = historyLoadingByDate[selectedDateKey] ?? false;

  React.useEffect(() => {
    const requestDateKey = selectedDateKey;
    const isAlreadyLoading = historyLoadingByDate[requestDateKey] ?? false;

    if (!userId || selectedHistory !== undefined || isAlreadyLoading) {
      return;
    }

    let isMounted = true;
    setHistoryLoadingByDate((previous) => ({
      ...previous,
      [requestDateKey]: true,
    }));

    void fetchDailyStudyHistory(userId, requestDateKey)
      .then((historyDoc) => {
        if (!isMounted) return;
        console.log("[calendar] selected dailyStudyHistory", {
          selectedDateKey: requestDateKey,
          historyDoc,
          vocabularyDays: historyDoc?.vocabularyDays ?? [],
        });
        setHistoryLoadingByDate((previous) => ({
          ...previous,
          [requestDateKey]: false,
        }));
        setHistoryByDate((previous) => ({
          ...previous,
          [requestDateKey]: historyDoc?.vocabularyDays ?? [],
        }));
      })
      .catch((error) => {
        console.error("Failed to fetch daily study history:", error);
        if (!isMounted) return;
        setHistoryLoadingByDate((previous) => ({
          ...previous,
          [requestDateKey]: false,
        }));
        setHistoryByDate((previous) => ({
          ...previous,
          [requestDateKey]: [],
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDateKey, selectedHistory, userId]);

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

  const isCurrentMonth = React.useMemo(() => {
    const today = new Date();
    return (
      visibleMonth.getFullYear() === today.getFullYear() &&
      visibleMonth.getMonth() === today.getMonth()
    );
  }, [visibleMonth]);

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

  const handlePressVocabularyDay = React.useCallback(
    (entry: VocabularyDayStudyEntry) => {
      router.push({
        pathname: "/course/[courseId]/vocabulary",
        params: {
          courseId: entry.courseId,
          day: String(entry.dayNumber),
        },
      });
    },
    [router],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColors.screen }]}
      edges={["left", "right"]}
    >
      <TopInstallNativeAd />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >


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
          isNextMonthDisabled={isCurrentMonth}
          onSelectDate={setSelectedDateKey}
        />

        <CalendarChart dailyStats={stats?.dailyStats ?? []} />

        <CalendarDayDetailCard
          title={detailTitle}
          stats={selectedCell?.stats}
          contributedToStreak={selectedCell?.contributedToStreak ?? false}
          vocabularyDays={selectedHistory ?? []}
          isHistoryLoading={selectedHistoryLoading}
          onPressVocabularyDay={handlePressVocabularyDay}
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
    padding: 10,
  },

});
