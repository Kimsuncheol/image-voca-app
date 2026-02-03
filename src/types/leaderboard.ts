/**
 * Leaderboard Types
 *
 * TypeScript interfaces for ranking and competitive features.
 */

export type LeaderboardMetric = 'wordsLearned' | 'currentStreak' | 'accuracy' | 'timeSpent';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

export type LeaderboardScope = 'global' | 'friends';

/**
 * Represents a single entry in the leaderboard
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number; // The actual value based on metric (e.g., words learned, streak days)
  isCurrentUser?: boolean; // Helper flag for highlighting
}

/**
 * Complete leaderboard with metadata
 */
export interface Leaderboard {
  id: string;
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  scope: LeaderboardScope;
  entries: LeaderboardEntry[];
  lastUpdated: string; // ISO timestamp
  periodStart: string; // ISO timestamp
  periodEnd: string; // ISO timestamp
}

/**
 * User's position and context within a leaderboard
 */
export interface UserLeaderboardPosition {
  rank: number;
  score: number;
  totalParticipants: number;
  percentile: number; // 0-100, where 100 is top 1%
  previousRank?: number; // For showing movement (↑ or ↓)
}

/**
 * Filter options for leaderboard queries
 */
export interface LeaderboardFilter {
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  scope: LeaderboardScope;
  limit?: number; // Number of top entries to fetch
}

/**
 * Summary stats for dashboard display
 */
export interface LeaderboardSummary {
  wordsLearnedRank?: number;
  streakRank?: number;
  accuracyRank?: number;
  timeSpentRank?: number;
  totalParticipants: number;
}
