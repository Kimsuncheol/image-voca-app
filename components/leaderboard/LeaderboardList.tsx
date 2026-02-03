import React from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { LeaderboardEntryCard } from './LeaderboardEntryCard';
import type { LeaderboardEntry } from '../../src/types/leaderboard';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  emptyMessage?: string;
}

export function LeaderboardList({
  entries,
  loading = false,
  emptyMessage,
}: LeaderboardListProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].tint} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>
          {emptyMessage || t('leaderboard.noEntries')}
        </ThemedText>
      </View>
    );
  }

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

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
});
