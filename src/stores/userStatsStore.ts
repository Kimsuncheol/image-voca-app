import AsyncStorage from "@react-native-async-storage/async-storage";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";
import { markStudyDate } from "../utils/notifications";

export interface DailyStats {
  date: string;
  wordsLearned: number;
  learnedWordIds: string[];
  correctAnswers: number;
  totalAnswers: number;
  timeSpentMinutes: number;
}

export interface UserStats {
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  dailyStats: DailyStats[];
  targetScore: number;
}

interface UserStatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchStats: (userId: string) => Promise<void>;
  updateDailyGoal: (userId: string, goal: number) => Promise<void>;
  updateTargetScore: (userId: string, score: number) => Promise<void>;
  recordWordLearned: (userId: string) => Promise<void>;
  recordUniqueWordLearned: (userId: string, wordId: string) => Promise<boolean>;
  recordQuizAnswer: (userId: string, correct: boolean) => Promise<void>;
  recordTimeSpent: (userId: string, minutes: number) => Promise<void>;

  // Computed getters
  getWordsLearnedForPeriod: (days: number) => number;
  getAccuracyForPeriod: (days: number) => number;
  getTimeSpentForPeriod: (days: number) => number;
  getTodayProgress: () => { current: number; goal: number };
}

const getToday = () => new Date().toISOString().split("T")[0];

const WEEKLY_WORDS_STORAGE_KEY = "voca_weekly_words_state";

type WeeklyWordsState = {
  weekStart: string;
  wordsLearned: number;
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7; // Monday as start of week.
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return formatLocalDate(start);
};

const normalizeWordsLearned = (value: unknown) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.floor(numberValue));
};

const buildWeeklyWordsState = (): WeeklyWordsState => ({
  weekStart: getWeekStart(),
  wordsLearned: 0,
});

const parseWeeklyWordsState = (raw: string | null): WeeklyWordsState => {
  const fallback = buildWeeklyWordsState();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;

    const weekStart =
      typeof parsed.weekStart === "string" && parsed.weekStart.length > 0
        ? parsed.weekStart
        : fallback.weekStart;
    const wordsLearned = normalizeWordsLearned(parsed.wordsLearned);

    return { weekStart, wordsLearned };
  } catch {
    return fallback;
  }
};

const loadWeeklyWordsState = async (): Promise<WeeklyWordsState> => {
  const raw = await AsyncStorage.getItem(WEEKLY_WORDS_STORAGE_KEY);
  return parseWeeklyWordsState(raw);
};

const saveWeeklyWordsState = async (state: WeeklyWordsState) => {
  await AsyncStorage.setItem(WEEKLY_WORDS_STORAGE_KEY, JSON.stringify(state));
};

const syncWeeklyWordsLearned = async (userId: string) => {
  const currentWeekStart = getWeekStart();
  const state = await loadWeeklyWordsState();

  if (state.weekStart !== currentWeekStart) {
    if (state.wordsLearned > 0) {
      await setDoc(
        doc(db, "users", userId),
        {
          weeklyStats: arrayUnion({
            weekStart: state.weekStart,
            wordsLearned: state.wordsLearned,
          }),
        },
        { merge: true },
      );
    }

    const resetState = { weekStart: currentWeekStart, wordsLearned: 0 };
    await saveWeeklyWordsState(resetState);
    return resetState;
  }

  return state;
};

const incrementWeeklyWordsLearned = async (
  userId: string,
  amount: number = 1,
) => {
  const state = await syncWeeklyWordsLearned(userId);
  const nextCount = Math.max(0, state.wordsLearned + amount);
  const nextState = { ...state, wordsLearned: nextCount };
  await saveWeeklyWordsState(nextState);
  return nextCount;
};

const getDefaultStats = (): UserStats => ({
  dailyGoal: 20,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: "",
  dailyStats: [],
  targetScore: 10,
});

export const useUserStatsStore = create<UserStatsState>((set, get) => ({
  stats: null,
  loading: false,
  error: null,

  fetchStats: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      try {
        await syncWeeklyWordsLearned(userId);
      } catch (error: any) {
        set({ error: error.message });
      }

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const stats: UserStats = {
          dailyGoal: data.dailyGoal || 20,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastActiveDate: data.lastActiveDate || "",
          dailyStats: (data.dailyStats || []).map((stat: any) => ({
            ...stat,
            learnedWordIds: stat.learnedWordIds || [],
          })),
          targetScore: data.targetScore || 10,
        };

        // Update streak if needed
        const today = getToday();
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];

        if (
          stats.lastActiveDate !== today &&
          stats.lastActiveDate !== yesterday
        ) {
          // Streak broken
          stats.currentStreak = 0;
        }

        set({ stats, loading: false });
      } else {
        // Create default stats
        const defaultStats = getDefaultStats();
        await setDoc(doc(db, "users", userId), defaultStats, { merge: true });
        set({ stats: defaultStats, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateDailyGoal: async (userId: string, goal: number) => {
    try {
      await updateDoc(doc(db, "users", userId), { dailyGoal: goal });
      set((state) => ({
        stats: state.stats ? { ...state.stats, dailyGoal: goal } : null,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateTargetScore: async (userId: string, score: number) => {
    try {
      await updateDoc(doc(db, "users", userId), { targetScore: score });
      set((state) => ({
        stats: state.stats ? { ...state.stats, targetScore: score } : null,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  recordWordLearned: async (userId: string) => {
    const { stats } = get();
    if (!stats) return;
    markStudyDate().catch(() => {});

    const today = getToday();
    const dailyStats = [...stats.dailyStats];
    let todayStats = dailyStats.find((d) => d.date === today);

    if (!todayStats) {
      todayStats = {
        date: today,
        wordsLearned: 0,
        learnedWordIds: [],
        correctAnswers: 0,
        totalAnswers: 0,
        timeSpentMinutes: 0,
      };
      dailyStats.push(todayStats);
    }

    todayStats.wordsLearned += 1;

    // Update streak
    let currentStreak = stats.currentStreak;
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate === yesterday) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    }

    const longestStreak = Math.max(stats.longestStreak, currentStreak);

    try {
      await updateDoc(doc(db, "users", userId), {
        dailyStats,
        currentStreak,
        longestStreak,
        lastActiveDate: today,
      });

      set({
        stats: {
          ...stats,
          dailyStats,
          currentStreak,
          longestStreak,
          lastActiveDate: today,
        },
      });
      try {
        await incrementWeeklyWordsLearned(userId);
      } catch (error: any) {
        set({ error: error.message });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  recordUniqueWordLearned: async (userId: string, wordId: string) => {
    const { stats } = get();
    if (!stats) return false;

    const today = getToday();
    const dailyStats = [...stats.dailyStats];
    let todayStats = dailyStats.find((d) => d.date === today);

    if (!todayStats) {
      todayStats = {
        date: today,
        wordsLearned: 0,
        learnedWordIds: [],
        correctAnswers: 0,
        totalAnswers: 0,
        timeSpentMinutes: 0,
      };
      dailyStats.push(todayStats);
    }

    // Ensure learnedWordIds exists (backward compatibility)
    if (!todayStats.learnedWordIds) {
      todayStats.learnedWordIds = [];
    }

    // Check if word was already learned today
    if (todayStats.learnedWordIds.includes(wordId)) {
      return false; // Already learned
    }

    // Add word to learned list
    todayStats.learnedWordIds.push(wordId);
    todayStats.wordsLearned += 1;

    // Update streak
    let currentStreak = stats.currentStreak;
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate === yesterday) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    }

    const longestStreak = Math.max(stats.longestStreak, currentStreak);

    try {
      markStudyDate().catch(() => {});
      await updateDoc(doc(db, "users", userId), {
        dailyStats,
        currentStreak,
        longestStreak,
        lastActiveDate: today,
      });

      set({
        stats: {
          ...stats,
          dailyStats,
          currentStreak,
          longestStreak,
          lastActiveDate: today,
        },
      });
      try {
        await incrementWeeklyWordsLearned(userId);
      } catch (error: any) {
        set({ error: error.message });
      }
      return true; // Successfully recorded new word
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  recordQuizAnswer: async (userId: string, correct: boolean) => {
    const { stats } = get();
    if (!stats) return;
    markStudyDate().catch(() => {});

    const today = getToday();
    const dailyStats = [...stats.dailyStats];
    let todayStats = dailyStats.find((d) => d.date === today);

    if (!todayStats) {
      todayStats = {
        date: today,
        wordsLearned: 0,
        learnedWordIds: [],
        correctAnswers: 0,
        totalAnswers: 0,
        timeSpentMinutes: 0,
      };
      dailyStats.push(todayStats);
    }

    todayStats.totalAnswers += 1;
    if (correct) {
      todayStats.correctAnswers += 1;
    }

    try {
      await updateDoc(doc(db, "users", userId), { dailyStats });
      set({ stats: { ...stats, dailyStats } });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  recordTimeSpent: async (userId: string, minutes: number) => {
    const { stats } = get();
    if (!stats) return;
    markStudyDate().catch(() => {});

    const today = getToday();
    const dailyStats = [...stats.dailyStats];
    let todayStats = dailyStats.find((d) => d.date === today);

    if (!todayStats) {
      todayStats = {
        date: today,
        wordsLearned: 0,
        learnedWordIds: [],
        correctAnswers: 0,
        totalAnswers: 0,
        timeSpentMinutes: 0,
      };
      dailyStats.push(todayStats);
    }

    todayStats.timeSpentMinutes += minutes;

    try {
      await updateDoc(doc(db, "users", userId), { dailyStats });
      set({ stats: { ...stats, dailyStats } });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  getWordsLearnedForPeriod: (days: number) => {
    const { stats } = get();
    if (!stats) return 0;

    const cutoffDate = new Date(Date.now() - days * 86400000)
      .toISOString()
      .split("T")[0];

    return stats.dailyStats
      .filter((d) => d.date >= cutoffDate)
      .reduce((sum, d) => sum + d.wordsLearned, 0);
  },

  getAccuracyForPeriod: (days: number) => {
    const { stats } = get();
    if (!stats) return 0;

    const cutoffDate = new Date(Date.now() - days * 86400000)
      .toISOString()
      .split("T")[0];

    const periodStats = stats.dailyStats.filter((d) => d.date >= cutoffDate);
    const totalCorrect = periodStats.reduce(
      (sum, d) => sum + d.correctAnswers,
      0,
    );
    const totalAnswers = periodStats.reduce(
      (sum, d) => sum + d.totalAnswers,
      0,
    );

    return totalAnswers > 0
      ? Math.round((totalCorrect / totalAnswers) * 100)
      : 0;
  },

  getTimeSpentForPeriod: (days: number) => {
    const { stats } = get();
    if (!stats) return 0;

    const cutoffDate = new Date(Date.now() - days * 86400000)
      .toISOString()
      .split("T")[0];

    return stats.dailyStats
      .filter((d) => d.date >= cutoffDate)
      .reduce((sum, d) => sum + d.timeSpentMinutes, 0);
  },

  getTodayProgress: () => {
    const { stats } = get();
    if (!stats) return { current: 0, goal: 20 };

    const today = getToday();
    const todayStats = stats.dailyStats.find((d) => d.date === today);

    return {
      current: todayStats?.wordsLearned || 0,
      goal: stats.dailyGoal,
    };
  },
}));
