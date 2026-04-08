import type { DailyStats } from "../stores";

export type CalendarActivityLevel = 0 | 1 | 2 | 3;

export interface CalendarDayCell {
  dateKey: string;
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  stats?: DailyStats;
  activityLevel: CalendarActivityLevel;
  contributedToStreak: boolean;
}

export interface CalendarMonthSummary {
  studyDays: number;
  wordsLearned: number;
  minutesSpent: number;
  quizzesTaken: number;
}

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map((part) => parseInt(part, 10));
  if (!year || !month || !day) {
    return new Date(dateKey);
  }
  return new Date(year, month - 1, day);
};

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date: Date, delta: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const addDays = (date: Date, delta: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
};

const getActivityLevel = (stats?: DailyStats): CalendarActivityLevel => {
  if (!stats) {
    return 0;
  }

  const score =
    stats.wordsLearned + stats.timeSpentMinutes * 0.5 + (stats.totalAnswers > 0 ? 5 : 0);

  if (score <= 0) {
    return 0;
  }
  if (score < 12) {
    return 1;
  }
  if (score < 28) {
    return 2;
  }
  return 3;
};

const buildStreakDateSet = (
  currentStreak: number,
  lastActiveDate: string | undefined,
): Set<string> => {
  if (!lastActiveDate || currentStreak <= 0) {
    return new Set();
  }

  const lastDate = parseDateKey(lastActiveDate);
  const keys = new Set<string>();

  for (let offset = 0; offset < currentStreak; offset += 1) {
    keys.add(formatDateKey(addDays(lastDate, -offset)));
  }

  return keys;
};

export const buildDailyStatsLookup = (
  dailyStats: DailyStats[],
): Record<string, DailyStats> =>
  dailyStats.reduce<Record<string, DailyStats>>((accumulator, entry) => {
    accumulator[entry.date] = entry;
    return accumulator;
  }, {});

export const buildMonthSummary = (
  monthStart: Date,
  dailyStatsByDate: Record<string, DailyStats>,
): CalendarMonthSummary => {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const entries = Object.values(dailyStatsByDate).filter((entry) => {
    const date = parseDateKey(entry.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  return entries.reduce<CalendarMonthSummary>(
    (summary, entry) => ({
      studyDays: summary.studyDays + 1,
      wordsLearned: summary.wordsLearned + entry.wordsLearned,
      minutesSpent: summary.minutesSpent + entry.timeSpentMinutes,
      quizzesTaken: summary.quizzesTaken + (entry.totalAnswers > 0 ? 1 : 0),
    }),
    {
      studyDays: 0,
      wordsLearned: 0,
      minutesSpent: 0,
      quizzesTaken: 0,
    },
  );
};

export const buildCalendarMonth = ({
  monthStart,
  selectedDateKey,
  todayKey,
  dailyStatsByDate,
  currentStreak,
  lastActiveDate,
}: {
  monthStart: Date;
  selectedDateKey: string;
  todayKey: string;
  dailyStatsByDate: Record<string, DailyStats>;
  currentStreak: number;
  lastActiveDate?: string;
}): CalendarDayCell[] => {
  const firstVisibleDate = addDays(monthStart, -monthStart.getDay());
  const streakDateKeys = buildStreakDateSet(currentStreak, lastActiveDate);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstVisibleDate, index);
    const dateKey = formatDateKey(date);
    const stats = dailyStatsByDate[dateKey];

    return {
      dateKey,
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey,
      stats,
      activityLevel: getActivityLevel(stats),
      contributedToStreak: streakDateKeys.has(dateKey),
    };
  });
};

export const getMonthPreferredSelectedDate = (
  monthStart: Date,
  dailyStatsByDate: Record<string, DailyStats>,
  todayKey: string,
): string => {
  const monthCells = buildCalendarMonth({
    monthStart,
    selectedDateKey: todayKey,
    todayKey,
    dailyStatsByDate,
    currentStreak: 0,
    lastActiveDate: undefined,
  }).filter((cell) => cell.isCurrentMonth);

  const todayCell = monthCells.find((cell) => cell.dateKey === todayKey);
  if (todayCell && todayCell.activityLevel > 0) {
    return todayCell.dateKey;
  }

  const activeCells = monthCells.filter((cell) => cell.activityLevel > 0);
  const pastOrToday = activeCells.filter((cell) => cell.dateKey <= todayKey);
  if (pastOrToday.length > 0) {
    return pastOrToday[pastOrToday.length - 1].dateKey;
  }

  return todayCell?.dateKey ?? monthCells[0]?.dateKey ?? todayKey;
};
