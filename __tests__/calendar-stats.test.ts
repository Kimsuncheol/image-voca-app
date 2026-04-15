import {
  buildCalendarMonth,
  buildDailyStatsLookup,
  buildMonthSummary,
  formatDateKey,
  getMonthPreferredSelectedDate,
  startOfMonth,
} from "../src/utils/calendarStats";

describe("calendarStats", () => {
  const lookup = buildDailyStatsLookup([
    {
      date: "2026-04-16",
      wordsLearned: 18,
      learnedWordIds: ["a", "b"],
      correctAnswers: 8,
      totalAnswers: 10,
    },
    {
      date: "2026-04-18",
      wordsLearned: 5,
      learnedWordIds: ["c"],
      correctAnswers: 0,
      totalAnswers: 0,
    },
  ]);

  it("builds month summary totals from daily stats", () => {
    const summary = buildMonthSummary(new Date(2026, 3, 1), lookup);

    expect(summary.studyDays).toBe(2);
    expect(summary.wordsLearned).toBe(23);
    expect(summary.quizzesTaken).toBe(1);
  });

  it("selects today when visible month contains today", () => {
    const selected = getMonthPreferredSelectedDate(
      startOfMonth(new Date(2026, 3, 1)),
      lookup,
      "2026-04-16",
    );

    expect(selected).toBe("2026-04-16");
  });

  it("marks streak contribution dates inside the current streak range", () => {
    const cells = buildCalendarMonth({
      monthStart: new Date(2026, 3, 1),
      selectedDateKey: "2026-04-16",
      todayKey: "2026-04-16",
      dailyStatsByDate: lookup,
      currentStreak: 3,
      lastActiveDate: "2026-04-16",
    });

    const streakKeys = cells
      .filter((cell) => cell.contributedToStreak)
      .map((cell) => cell.dateKey);

    expect(streakKeys).toEqual(
      expect.arrayContaining(["2026-04-14", "2026-04-15", "2026-04-16"]),
    );
  });

  it("keeps local date formatting stable", () => {
    expect(formatDateKey(new Date(2026, 3, 6))).toBe("2026-04-06");
  });
});
