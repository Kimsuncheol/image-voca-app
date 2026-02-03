// ============================================================================
// IMPORTS
// ============================================================================

import React from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { LeaderboardEntryCard } from './LeaderboardEntryCard';
import type { LeaderboardEntry } from '../../src/types/leaderboard';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the LeaderboardList component
 *
 * @property entries - Array of leaderboard entries with user data and scores
 * @property loading - Loading state indicator
 * @property emptyMessage - Custom message to display when list is empty
 */
interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  emptyMessage?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * LeaderboardList - Displays a ranked list of users in the leaderboard
 *
 * Features:
 * - FlatList for efficient rendering of leaderboard entries
 * - Shows loading spinner during data fetch
 * - Displays empty state message when no entries
 * - Current user's entry is highlighted
 * - Top 3 users shown with medal icons (gold, silver, bronze)
 * - Scrollable list for viewing all rankings
 *
 * This component is used in the LeaderboardScreen to display competitive rankings.
 */
export function LeaderboardList({
  entries,
  loading = false,
  emptyMessage,
}: LeaderboardListProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------

  /**
   * Show centered loading spinner while leaderboard data is being fetched
   */
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].tint} />
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------------------------------

  /**
   * Show empty state message when there are no leaderboard entries
   * Displays custom message if provided, otherwise uses default translation
   */
  if (entries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>
          {emptyMessage || t('leaderboard.noEntries')}
        </ThemedText>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------

  /**
   * Render FlatList of leaderboard entry cards
   * Each card displays user rank, profile, and score
   */
  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.userId}
      renderItem={({ item }) => <LeaderboardEntryCard entry={item} />}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // List container padding
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Centered container for loading and empty states
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Empty state message
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
});
