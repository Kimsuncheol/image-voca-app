/**
 * Leaderboard Service
 *
 * Service for generating and managing leaderboards.
 * Calculates rankings based on various metrics and time periods.
 */

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getFriends } from './friendService';
import type {
  LeaderboardEntry,
  Leaderboard,
  LeaderboardMetric,
  LeaderboardPeriod,
  LeaderboardScope,
  LeaderboardFilter,
  UserLeaderboardPosition,
} from '../types/leaderboard';

const USERS_COLLECTION = 'users';

/**
 * Gets the date range for a given period
 */
function getDateRange(period: LeaderboardPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'allTime':
      start.setFullYear(2000); // Beginning of time for this app
      break;
  }

  return { start, end };
}

/**
 * Formats date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculates score for a user based on metric and period
 */
function calculateScore(
  userData: any,
  metric: LeaderboardMetric,
  startDate: Date,
  endDate: Date
): number {
  const dailyStats = userData.dailyStats || [];
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  switch (metric) {
    case 'wordsLearned': {
      return dailyStats
        .filter((day: any) => day.date >= startDateStr && day.date <= endDateStr)
        .reduce((sum: number, day: any) => sum + (day.wordsLearned || 0), 0);
    }

    case 'currentStreak': {
      // Current streak is already calculated and stored
      return userData.currentStreak || 0;
    }

    case 'accuracy': {
      const relevantDays = dailyStats.filter(
        (day: any) => day.date >= startDateStr && day.date <= endDateStr
      );
      const totalCorrect = relevantDays.reduce(
        (sum: number, day: any) => sum + (day.correctAnswers || 0),
        0
      );
      const totalAnswers = relevantDays.reduce(
        (sum: number, day: any) => sum + (day.totalAnswers || 0),
        0
      );
      return totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
    }

    case 'timeSpent': {
      return dailyStats
        .filter((day: any) => day.date >= startDateStr && day.date <= endDateStr)
        .reduce((sum: number, day: any) => sum + (day.timeSpentMinutes || 0), 0);
    }

    default:
      return 0;
  }
}

/**
 * Generates a leaderboard based on specified filters
 */
export async function generateLeaderboard(
  filter: LeaderboardFilter,
  currentUserId?: string
): Promise<Leaderboard> {
  try {
    const { metric, period, scope, limit = 50 } = filter;
    const { start, end } = getDateRange(period);

    let userIds: string[] = [];

    // Determine which users to include based on scope
    if (scope === 'friends' && currentUserId) {
      const friends = await getFriends(currentUserId);
      userIds = friends.map((f) => f.userProfile.uid);
      // Include current user in friends leaderboard
      userIds.push(currentUserId);
    }

    // Fetch user data
    const usersRef = collection(db, USERS_COLLECTION);
    let snapshot;

    if (scope === 'friends' && userIds.length > 0) {
      // For friends scope, we need to fetch only specific users
      // Note: Firestore 'in' queries are limited to 10 items, so we fetch all and filter
      snapshot = await getDocs(usersRef);
    } else {
      // For global scope, fetch all users
      snapshot = await getDocs(usersRef);
    }

    // Calculate scores and build entries
    const entries: LeaderboardEntry[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const userId = doc.id;

      // Filter by scope
      if (scope === 'friends' && !userIds.includes(userId)) {
        return;
      }

      const score = calculateScore(data, metric, start, end);

      // Only include users with non-zero scores (except for streak which can be 0)
      if (score > 0 || metric === 'currentStreak') {
        entries.push({
          rank: 0, // Will be set after sorting
          userId,
          displayName: data.displayName || data.name || 'Unknown',
          photoURL: data.photoURL,
          score,
          isCurrentUser: userId === currentUserId,
        });
      }
    });

    // Sort by score (descending)
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks (handle ties)
    let currentRank = 1;
    entries.forEach((entry, index) => {
      if (index > 0 && entry.score < entries[index - 1].score) {
        currentRank = index + 1;
      }
      entry.rank = currentRank;
    });

    // Limit results
    const limitedEntries = entries.slice(0, limit);

    // If current user is not in top results but exists in full list, add them
    if (currentUserId) {
      const userInTop = limitedEntries.find((e) => e.userId === currentUserId);
      if (!userInTop) {
        const userEntry = entries.find((e) => e.userId === currentUserId);
        if (userEntry) {
          limitedEntries.push(userEntry);
        }
      }
    }

    return {
      id: `${metric}_${period}_${scope}_${Date.now()}`,
      metric,
      period,
      scope,
      entries: limitedEntries,
      lastUpdated: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    };
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    throw error;
  }
}

/**
 * Gets a user's position in the leaderboard
 */
export async function getUserLeaderboardPosition(
  userId: string,
  filter: LeaderboardFilter
): Promise<UserLeaderboardPosition | null> {
  try {
    const leaderboard = await generateLeaderboard(filter, userId);
    const userEntry = leaderboard.entries.find((e) => e.userId === userId);

    if (!userEntry) {
      return null;
    }

    const totalParticipants = leaderboard.entries.length;
    const percentile = totalParticipants > 0
      ? Math.round(((totalParticipants - userEntry.rank + 1) / totalParticipants) * 100)
      : 0;

    return {
      rank: userEntry.rank,
      score: userEntry.score,
      totalParticipants,
      percentile,
    };
  } catch (error) {
    console.error('Error getting user leaderboard position:', error);
    throw error;
  }
}

/**
 * Gets leaderboard entries around a specific user's rank
 */
export async function getLeaderboardAroundUser(
  userId: string,
  filter: LeaderboardFilter,
  context: number = 5
): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await generateLeaderboard(filter, userId);
    const userEntry = leaderboard.entries.find((e) => e.userId === userId);

    if (!userEntry) {
      return [];
    }

    const userIndex = leaderboard.entries.findIndex((e) => e.userId === userId);
    const startIndex = Math.max(0, userIndex - context);
    const endIndex = Math.min(leaderboard.entries.length, userIndex + context + 1);

    return leaderboard.entries.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error getting leaderboard around user:', error);
    throw error;
  }
}

/**
 * Gets the top N users for a specific metric
 */
export async function getTopUsers(
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const filter: LeaderboardFilter = {
      metric,
      period,
      scope: 'global',
      limit,
    };

    const leaderboard = await generateLeaderboard(filter);
    return leaderboard.entries.slice(0, limit);
  } catch (error) {
    console.error('Error getting top users:', error);
    throw error;
  }
}

/**
 * Gets multiple leaderboards for dashboard display
 */
export async function getMultipleLeaderboards(
  currentUserId: string,
  period: LeaderboardPeriod = 'weekly'
): Promise<Record<LeaderboardMetric, Leaderboard>> {
  try {
    const metrics: LeaderboardMetric[] = ['wordsLearned', 'currentStreak', 'accuracy', 'timeSpent'];
    const leaderboards: Record<string, Leaderboard> = {};

    // Fetch all leaderboards in parallel
    const results = await Promise.all(
      metrics.map((metric) =>
        generateLeaderboard(
          {
            metric,
            period,
            scope: 'global',
            limit: 10,
          },
          currentUserId
        )
      )
    );

    metrics.forEach((metric, index) => {
      leaderboards[metric] = results[index];
    });

    return leaderboards as Record<LeaderboardMetric, Leaderboard>;
  } catch (error) {
    console.error('Error getting multiple leaderboards:', error);
    throw error;
  }
}
