import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';
import type { LeaderboardEntry } from '../../src/types/leaderboard';

interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
}

export function LeaderboardEntryCard({ entry }: LeaderboardEntryCardProps) {
  const { isDark } = useTheme();

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
      {/* Rank */}
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

      {/* User Info */}
      <View style={styles.userSection}>
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
        <ThemedText
          style={[styles.displayName, entry.isCurrentUser && styles.highlightedText]}
          numberOfLines={1}
        >
          {entry.displayName}
          {entry.isCurrentUser && ' (You)'}
        </ThemedText>
      </View>

      {/* Score */}
      <ThemedText
        style={[styles.score, entry.isCurrentUser && styles.highlightedScore]}
      >
        {entry.score}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
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
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  highlightedText: {
    fontWeight: '700',
    color: '#007AFF',
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  highlightedScore: {
    color: '#007AFF',
  },
});
