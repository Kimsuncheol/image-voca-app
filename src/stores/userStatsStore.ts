import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";
import { markStudyDate } from "../utils/notifications";

export interface DailyStats {
  date: string;
  wordsLearned: number;
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
}

interface UserStatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchStats: (userId: string) => Promise<void>;
  updateDailyGoal: (userId: string, goal: number) => Promise<void>;
  recordWordLearned: (userId: string) => Promise<void>;
  recordQuizAnswer: (userId: string, correct: boolean) => Promise<void>;
  recordTimeSpent: (userId: string, minutes: number) => Promise<void>;

  // Computed getters
  getWordsLearnedForPeriod: (days: number) => number;
  getAccuracyForPeriod: (days: number) => number;
  getTimeSpentForPeriod: (days: number) => number;
  getTodayProgress: () => { current: number; goal: number };
}

const getToday = () => new Date().toISOString().split("T")[0];

const getDefaultStats = (): UserStats => ({
  dailyGoal: 20,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: "",
  dailyStats: [],
});

export const useUserStatsStore = create<UserStatsState>((set, get) => ({
  stats: null,
  loading: false,
  error: null,

  fetchStats: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const stats: UserStats = {
          dailyGoal: data.dailyGoal || 20,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastActiveDate: data.lastActiveDate || "",
          dailyStats: data.dailyStats || [],
        };
        
        // Update streak if needed
        const today = getToday();
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        
        if (stats.lastActiveDate !== today && stats.lastActiveDate !== yesterday) {
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
        correctAnswers: 0,
        totalAnswers: 0,
        timeSpentMinutes: 0,
      };
      dailyStats.push(todayStats);
    }

    todayStats.wordsLearned += 1;

    // Update streak
    let currentStreak = stats.currentStreak;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
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
    } catch (error: any) {
      set({ error: error.message });
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
    const totalCorrect = periodStats.reduce((sum, d) => sum + d.correctAnswers, 0);
    const totalAnswers = periodStats.reduce((sum, d) => sum + d.totalAnswers, 0);

    return totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
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
