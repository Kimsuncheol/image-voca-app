import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { useLeaderboardStore } from '../src/stores/leaderboardStore';
import { ThemedText } from '../components/themed-text';
import { IconSymbol } from '../components/ui/icon-symbol';
import { LeaderboardList } from '../components/leaderboard/LeaderboardList';
import { Colors } from '../constants/theme';
import type {
  LeaderboardMetric,
  LeaderboardPeriod,
  LeaderboardScope,
} from '../src/types/leaderboard';

const METRICS: { key: LeaderboardMetric; icon: string; label: string }[] = [
  { key: 'wordsLearned', icon: 'book.fill', label: 'Words' },
  { key: 'currentStreak', icon: 'flame.fill', label: 'Streak' },
  { key: 'accuracy', icon: 'checkmark.circle.fill', label: 'Accuracy' },
  { key: 'timeSpent', icon: 'clock.fill', label: 'Time' },
];

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'allTime', label: 'All Time' },
];

const SCOPES: { key: LeaderboardScope; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'friends', label: 'Friends' },
];

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const {
    currentLeaderboard,
    userPosition,
    loading,
    currentMetric,
    currentPeriod,
    currentScope,
    fetchLeaderboard,
    fetchUserPosition,
    setFilter,
  } = useLeaderboardStore();

  const [refreshing, setRefreshing] = useState(false);

  // Fetch leaderboard on mount and when filters change
  useEffect(() => {
    if (user?.uid) {
      fetchLeaderboard(
        {
          metric: currentMetric,
          period: currentPeriod,
          scope: currentScope,
          limit: 50,
        },
        user.uid
      );

      fetchUserPosition(user.uid, {
        metric: currentMetric,
        period: currentPeriod,
        scope: currentScope,
      });
    }
  }, [user?.uid, currentMetric, currentPeriod, currentScope]);

  const handleRefresh = async () => {
    if (!user?.uid) return;

    setRefreshing(true);
    await Promise.all([
      fetchLeaderboard(
        {
          metric: currentMetric,
          period: currentPeriod,
          scope: currentScope,
          limit: 50,
        },
        user.uid
      ),
      fetchUserPosition(user.uid, {
        metric: currentMetric,
        period: currentPeriod,
        scope: currentScope,
      }),
    ]);
    setRefreshing(false);
  };

  const handleMetricChange = (metric: LeaderboardMetric) => {
    setFilter(metric, currentPeriod, currentScope);
  };

  const handlePeriodChange = (period: LeaderboardPeriod) => {
    setFilter(currentMetric, period, currentScope);
  };

  const handleScopeChange = (scope: LeaderboardScope) => {
    setFilter(currentMetric, currentPeriod, scope);
  };

  const getMetricLabel = (metric: LeaderboardMetric) => {
    return METRICS.find((m) => m.key === metric)?.label || 'Words';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {t('leaderboard.title')}
        </ThemedText>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <IconSymbol
            name="arrow.clockwise"
            size={20}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      </View>

      {/* User Position Card */}
      {userPosition && (
        <View
          style={[
            styles.positionCard,
            { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
          ]}
        >
          <View style={styles.positionHeader}>
            <ThemedText style={styles.positionLabel}>Your Rank</ThemedText>
            <ThemedText style={styles.positionRank}>
              #{userPosition.rank}
            </ThemedText>
          </View>
          <View style={styles.positionStats}>
            <View style={styles.positionStat}>
              <ThemedText style={styles.positionStatLabel}>Score</ThemedText>
              <ThemedText style={styles.positionStatValue}>
                {userPosition.score}
              </ThemedText>
            </View>
            <View style={styles.positionStat}>
              <ThemedText style={styles.positionStatLabel}>Top</ThemedText>
              <ThemedText style={styles.positionStatValue}>
                {userPosition.percentile}%
              </ThemedText>
            </View>
            <View style={styles.positionStat}>
              <ThemedText style={styles.positionStatLabel}>Users</ThemedText>
              <ThemedText style={styles.positionStatValue}>
                {userPosition.totalParticipants}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Metric Filters */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricFilters}
        >
          {METRICS.map((metric) => (
            <TouchableOpacity
              key={metric.key}
              style={[
                styles.metricButton,
                {
                  backgroundColor:
                    currentMetric === metric.key
                      ? '#007AFF'
                      : isDark
                      ? '#1c1c1e'
                      : '#f5f5f5',
                },
              ]}
              onPress={() => handleMetricChange(metric.key)}
            >
              <IconSymbol
                name={metric.icon as any}
                size={20}
                color={currentMetric === metric.key ? '#fff' : isDark ? '#fff' : '#000'}
              />
              <ThemedText
                style={[
                  styles.metricButtonText,
                  currentMetric === metric.key && styles.activeMetricText,
                ]}
              >
                {metric.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Period and Scope Filters */}
      <View style={styles.filterRow}>
        <View style={styles.filterGroup}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    currentPeriod === period.key
                      ? '#007AFF20'
                      : 'transparent',
                },
              ]}
              onPress={() => handlePeriodChange(period.key)}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  currentPeriod === period.key && styles.activeFilterText,
                ]}
              >
                {period.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.scopeGroup}>
          {SCOPES.map((scope) => (
            <TouchableOpacity
              key={scope.key}
              style={[
                styles.scopeButton,
                {
                  backgroundColor:
                    currentScope === scope.key
                      ? '#007AFF'
                      : isDark
                      ? '#1c1c1e'
                      : '#f5f5f5',
                },
              ]}
              onPress={() => handleScopeChange(scope.key)}
            >
              <ThemedText
                style={[
                  styles.scopeButtonText,
                  currentScope === scope.key && styles.activeScopeText,
                ]}
              >
                {scope.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Leaderboard List */}
      <View style={styles.content}>
        <LeaderboardList
          entries={currentLeaderboard?.entries || []}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  positionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  positionRank: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  positionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  positionStat: {
    alignItems: 'center',
  },
  positionStatLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  positionStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterSection: {
    paddingVertical: 8,
  },
  metricFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  metricButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeMetricText: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
  activeFilterText: {
    opacity: 1,
    color: '#007AFF',
    fontWeight: '700',
  },
  scopeGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  scopeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scopeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeScopeText: {
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
