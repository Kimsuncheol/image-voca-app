// ============================================================================
// IMPORTS
// ============================================================================

import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';
import type { LeaderboardEntry } from '../../src/types/leaderboard';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the LeaderboardEntryCard component
 *
 * @property entry - Leaderboard entry with user rank, profile, and score
 */
interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * LeaderboardEntryCard - Individual leaderboard entry card component
 *
 * Features:
 * - Displays user rank (trophy icon for top 3, number for others)
 * - Shows user profile photo or placeholder avatar
 * - Displays user's display name
 * - Shows score for the selected metric
 * - Highlights current user with blue border and text
 * - Medal colors for top 3 ranks:
 *   - 1st place: Gold (#FFD700)
 *   - 2nd place: Silver (#C0C0C0)
 *   - 3rd place: Bronze (#CD7F32)
 * - Theme-aware styling for dark/light modes
 *
 * This component is used within LeaderboardList to display each ranked user.
 */
export function LeaderboardEntryCard({ entry }: LeaderboardEntryCardProps) {
  const { isDark } = useTheme();

  // --------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Get medal color based on rank
   * Returns appropriate color for top 3 positions, undefined for others
   *
   * @param rank - User's rank position (1-based)
   * @returns Medal color hex string or undefined
   */
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return undefined;
    }
  };

  const medalColor = getMedalColor(entry.rank);

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: entry.isCurrentUser
            ? isDark
              ? '#2c2c2e'
              : '#e8f4fd'
            : isDark
            ? '#1c1c1e'
            : '#f5f5f5',
        },
        entry.isCurrentUser && styles.highlightedCard,
      ]}
    >
      {/* ============================================
          RANK SECTION
          - Trophy icon for top 3 (colored by rank)
          - Numbered rank for positions 4+
          ============================================ */}
      <View style={styles.rankContainer}>
        {entry.rank <= 3 ? (
          <IconSymbol
            name="trophy.fill"
            size={24}
            color={medalColor}
          />
        ) : (
          <ThemedText style={styles.rankText}>#{entry.rank}</ThemedText>
        )}
      </View>

      {/* ============================================
          USER INFO SECTION
          - Profile photo or placeholder avatar
          - Display name with "(You)" suffix for current user
          ============================================ */}
      <View style={styles.userSection}>
        {/* Avatar: Photo or placeholder icon */}
        {entry.photoURL ? (
          <Image source={{ uri: entry.photoURL }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: isDark ? '#2c2c2e' : '#e0e0e0' },
            ]}
          >
            <IconSymbol
              name="person.fill"
              size={20}
              color={isDark ? '#8e8e93' : '#636366'}
            />
          </View>
        )}

        {/* Display name with current user indicator */}
        <ThemedText
          style={[styles.displayName, entry.isCurrentUser && styles.highlightedText]}
          numberOfLines={1}
        >
          {entry.displayName}
          {entry.isCurrentUser && ' (You)'}
        </ThemedText>
      </View>

      {/* ============================================
          SCORE SECTION
          - Shows numerical score for selected metric
          - Highlighted in blue for current user
          ============================================ */}
      <ThemedText
        style={[styles.score, entry.isCurrentUser && styles.highlightedScore]}
      >
        {entry.score}
      </ThemedText>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main card container
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  // Current user highlight (blue border)
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },

  // Rank section styles
  rankContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.7,
  },

  // User section styles
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18, // Circular avatar
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },

  // Current user text highlight
  highlightedText: {
    fontWeight: '700',
    color: '#007AFF',
  },

  // Score styles
  score: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },

  // Current user score highlight
  highlightedScore: {
    color: '#007AFF',
  },
});
