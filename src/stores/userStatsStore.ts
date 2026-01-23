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

interface DayProgress {
  completed?: boolean;
  wordsLearned?: number;
  totalWords?: number;
  quizCompleted?: boolean;
  quizScore?: number;
  accumulatedCorrect?: number;
  isRetake?: boolean;
}

type CourseProgress = Record<number, DayProgress>;

interface UserStatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  courseProgress: Record<string, CourseProgress>;

  // Actions
  fetchStats: (userId: string) => Promise<void>;
  fetchCourseProgress: (userId: string, courseId: string) => Promise<void>;
  setCourseProgress: (courseId: string, progress: CourseProgress) => void;
  updateCourseDayProgress: (
    courseId: string,
    day: number,
    patch: Partial<DayProgress>,
  ) => void;
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

  // Buffering
  bufferQuizAnswer: (userId: string, correct: boolean) => void;
  flushQuizStats: (userId: string) => Promise<void>;
  pendingQuizStats: { total: number; correct: number };
  bufferWordLearned: (userId: string, wordId: string) => void;
  flushWordStats: (userId: string) => Promise<void>;
  pendingWordStats: string[];
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
  courseProgress: {},
  pendingQuizStats: { total: 0, correct: 0 },
  pendingWordStats: [],

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

  fetchCourseProgress: async (userId: string, courseId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const progress = data.courseProgress?.[courseId] || {};
        set((state) => ({
          courseProgress: { ...state.courseProgress, [courseId]: progress },
        }));
      } else {
        set((state) => ({
          courseProgress: { ...state.courseProgress, [courseId]: {} },
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCourseProgress: (courseId: string, progress: CourseProgress) => {
    set((state) => ({
      courseProgress: { ...state.courseProgress, [courseId]: progress },
    }));
  },

  updateCourseDayProgress: (
    courseId: string,
    day: number,
    patch: Partial<DayProgress>,
  ) => {
    set((state) => {
      const course = state.courseProgress[courseId] || {};
      const dayProgress = course[day] || {};
      return {
        courseProgress: {
          ...state.courseProgress,
          [courseId]: {
            ...course,
            [day]: { ...dayProgress, ...patch },
          },
        },
      };
    });
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
    // Legacy: use buffered version instead when possible
    const { bufferWordLearned, flushWordStats } = get();
    bufferWordLearned(userId, wordId);
    await flushWordStats(userId);
    return true; // Assume success for legacy calls
  },

  bufferWordLearned: (userId: string, wordId: string) => {
    const { stats, pendingWordStats } = get();
    if (!stats) return;

    // Update local state immediately for UI responsiveness
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

    if (!todayStats.learnedWordIds) {
      todayStats.learnedWordIds = [];
    }

    // Check if word was already learned today
    if (todayStats.learnedWordIds.includes(wordId)) {
      return;
    }

    // Add word to learned list
    todayStats.learnedWordIds.push(wordId);
    todayStats.wordsLearned += 1;

    // Update streak logic
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

    // Update local store
    set({
      stats: {
        ...stats,
        dailyStats,
        currentStreak,
        longestStreak,
        lastActiveDate: today,
      },
      pendingWordStats: [...pendingWordStats, wordId],
    });
  },

  flushWordStats: async (userId: string) => {
    const { stats, pendingWordStats } = get();
    if (!stats || pendingWordStats.length === 0) return;

    const wordsToFlush = [...pendingWordStats];
    set({ pendingWordStats: [] });

    try {
      const today = getToday();
      const userRef = doc(db, "users", userId);

      // Perform arrayUnion on learnedWordIds for the specific day is tricky in deep objects
      // We will read-modify-write for simplicity or just update the whole dailyStats array if possible
      // But Firestore arrayUnion doesn't work deep inside objects in an array.
      // So we must fetch, update, and set.

      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const serverDailyStats = data.dailyStats || [];
        let serverTodayStats = serverDailyStats.find(
          (d: any) => d.date === today,
        );

        if (!serverTodayStats) {
          serverTodayStats = {
            date: today,
            wordsLearned: 0,
            learnedWordIds: [],
            correctAnswers: 0,
            totalAnswers: 0,
            timeSpentMinutes: 0,
          };
          serverDailyStats.push(serverTodayStats);
        }

        if (!serverTodayStats.learnedWordIds) {
          serverTodayStats.learnedWordIds = [];
        }

        // Add new unique words
        const newWords = wordsToFlush.filter(
          (id) => !serverTodayStats.learnedWordIds.includes(id),
        );
        if (newWords.length > 0) {
          serverTodayStats.learnedWordIds.push(...newWords);
          serverTodayStats.wordsLearned =
            serverTodayStats.learnedWordIds.length;

          // Also update streak fields on the root document
          await updateDoc(userRef, {
            dailyStats: serverDailyStats,
            lastActiveDate: today,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
          });

          try {
            // For simplicity, we just increment weekly stats by the count of new words
            // This might be slightly off if we re-learn a word, but buffer filters duplicates locally
            await incrementWeeklyWordsLearned(userId, newWords.length);
          } catch (e) {
            console.error("Failed to sync weekly stats", e);
          }
        }
      }
      markStudyDate().catch(() => {});
    } catch (error: any) {
      console.error("Failed to flush word stats:", error);
      // Restore pending stats on failure
      set((state) => ({
        pendingWordStats: [...state.pendingWordStats, ...wordsToFlush],
      }));
    }
  },

  recordQuizAnswer: async (userId: string, correct: boolean) => {
    // Legacy: use buffered version instead when possible
    const { bufferQuizAnswer, flushQuizStats } = get();
    bufferQuizAnswer(userId, correct);
    await flushQuizStats(userId);
  },

  bufferQuizAnswer: (userId: string, correct: boolean) => {
    const { stats, pendingQuizStats } = get();
    if (!stats) return;

    // Update local state immediately for UI responsiveness
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

    // Accumulate pending stats
    const newPending = {
      total: pendingQuizStats.total + 1,
      correct: pendingQuizStats.correct + (correct ? 1 : 0),
    };

    set({
      stats: { ...stats, dailyStats },
      pendingQuizStats: newPending,
    });
  },

  flushQuizStats: async (userId: string) => {
    const { stats, pendingQuizStats } = get();
    if (!stats || pendingQuizStats.total === 0) return;

    // Reset pending immediately to prevent double submission
    set({ pendingQuizStats: { total: 0, correct: 0 } });

    try {
      const today = getToday();
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const serverDailyStats = data.dailyStats || [];
        let serverTodayStats = serverDailyStats.find(
          (d: any) => d.date === today,
        );

        if (!serverTodayStats) {
          serverTodayStats = {
            date: today,
            wordsLearned: 0,
            learnedWordIds: [],
            correctAnswers: 0,
            totalAnswers: 0,
            timeSpentMinutes: 0,
          };
          serverDailyStats.push(serverTodayStats);
        }

        serverTodayStats.totalAnswers += pendingQuizStats.total;
        serverTodayStats.correctAnswers += pendingQuizStats.correct;

        await updateDoc(userRef, { dailyStats: serverDailyStats });
      }
    } catch (error: any) {
      // On error, restore pending stats?
      // For now, just log and accept that strict consistency might drift slightly in edge cases
      // or implement more robust retry logic later.
      console.error("Failed to flush quiz stats:", error);
      set((state) => ({
        pendingQuizStats: {
          total: state.pendingQuizStats.total + pendingQuizStats.total,
          correct: state.pendingQuizStats.correct + pendingQuizStats.correct,
        },
      }));
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
