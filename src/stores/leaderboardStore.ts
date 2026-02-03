/**
 * Leaderboard Store
 *
 * Zustand store for managing leaderboard state and rankings.
 */

import { create } from 'zustand';
import type {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
  LeaderboardScope,
  LeaderboardFilter,
  UserLeaderboardPosition,
} from '../types/leaderboard';
import * as leaderboardService from '../services/leaderboardService';

interface LeaderboardState {
  // State
  currentLeaderboard: Leaderboard | null;
  userPosition: UserLeaderboardPosition | null;
  leaderboardsCache: Record<string, Leaderboard>; // Cached leaderboards by filter key
  loading: boolean;
  error: string | null;

  // Current filter settings
  currentMetric: LeaderboardMetric;
  currentPeriod: LeaderboardPeriod;
  currentScope: LeaderboardScope;

  // Actions
  fetchLeaderboard: (
    filter: LeaderboardFilter,
    userId?: string
  ) => Promise<void>;
  fetchUserPosition: (
    userId: string,
    filter: LeaderboardFilter
  ) => Promise<void>;
  fetchMultipleLeaderboards: (
    userId: string,
    period?: LeaderboardPeriod
  ) => Promise<void>;
  setFilter: (
    metric: LeaderboardMetric,
    period: LeaderboardPeriod,
    scope: LeaderboardScope
  ) => void;
  refreshLeaderboard: (userId?: string) => Promise<void>;
  getCachedLeaderboard: (filter: LeaderboardFilter) => Leaderboard | null;
  reset: () => void;
}

const initialState = {
  currentLeaderboard: null,
  userPosition: null,
  leaderboardsCache: {},
  loading: false,
  error: null,
  currentMetric: 'wordsLearned' as LeaderboardMetric,
  currentPeriod: 'weekly' as LeaderboardPeriod,
  currentScope: 'global' as LeaderboardScope,
};

/**
 * Generates a cache key for a leaderboard filter
 */
function getCacheKey(filter: LeaderboardFilter): string {
  return `${filter.metric}_${filter.period}_${filter.scope}`;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  ...initialState,

  /**
   * Fetches a leaderboard based on filter
   */
  fetchLeaderboard: async (filter: LeaderboardFilter, userId?: string) => {
    try {
      set({ loading: true, error: null });

      const leaderboard = await leaderboardService.generateLeaderboard(filter, userId);
      const cacheKey = getCacheKey(filter);

      set((state) => ({
        currentLeaderboard: leaderboard,
        leaderboardsCache: {
          ...state.leaderboardsCache,
          [cacheKey]: leaderboard,
        },
        currentMetric: filter.metric,
        currentPeriod: filter.period,
        currentScope: filter.scope,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
        loading: false,
      });
    }
  },

  /**
   * Fetches user's position in the leaderboard
   */
  fetchUserPosition: async (userId: string, filter: LeaderboardFilter) => {
    try {
      const position = await leaderboardService.getUserLeaderboardPosition(userId, filter);
      set({ userPosition: position });
    } catch (error) {
      console.error('Error fetching user position:', error);
    }
  },

  /**
   * Fetches multiple leaderboards for dashboard
   */
  fetchMultipleLeaderboards: async (userId: string, period: LeaderboardPeriod = 'weekly') => {
    try {
      set({ loading: true, error: null });

      const leaderboards = await leaderboardService.getMultipleLeaderboards(userId, period);

      // Cache all leaderboards
      const newCache: Record<string, Leaderboard> = {};
      Object.entries(leaderboards).forEach(([metric, leaderboard]) => {
        const filter: LeaderboardFilter = {
          metric: metric as LeaderboardMetric,
          period,
          scope: 'global',
        };
        const cacheKey = getCacheKey(filter);
        newCache[cacheKey] = leaderboard;
      });

      set((state) => ({
        leaderboardsCache: {
          ...state.leaderboardsCache,
          ...newCache,
        },
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching multiple leaderboards:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboards',
        loading: false,
      });
    }
  },

  /**
   * Sets the current filter settings
   */
  setFilter: (
    metric: LeaderboardMetric,
    period: LeaderboardPeriod,
    scope: LeaderboardScope
  ) => {
    set({
      currentMetric: metric,
      currentPeriod: period,
      currentScope: scope,
    });
  },

  /**
   * Refreshes the current leaderboard
   */
  refreshLeaderboard: async (userId?: string) => {
    const { currentMetric, currentPeriod, currentScope } = get();
    const filter: LeaderboardFilter = {
      metric: currentMetric,
      period: currentPeriod,
      scope: currentScope,
    };
    await get().fetchLeaderboard(filter, userId);
  },

  /**
   * Gets a cached leaderboard if available
   */
  getCachedLeaderboard: (filter: LeaderboardFilter): Leaderboard | null => {
    const cacheKey = getCacheKey(filter);
    return get().leaderboardsCache[cacheKey] || null;
  },

  /**
   * Resets the store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));
