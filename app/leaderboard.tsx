// ============================================================================
// IMPORTS
// ============================================================================

// React and React Native core imports
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';

// Third-party libraries
import { useTranslation } from 'react-i18next'; // i18n internationalization support
import { router } from 'expo-router'; // Navigation routing

// Context and state management
import { useAuth } from '../src/context/AuthContext'; // User authentication state
import { useTheme } from '../src/context/ThemeContext'; // Dark/Light theme management
import { useLeaderboardStore } from '../src/stores/leaderboardStore'; // Zustand store for leaderboard

// Custom components
import { ThemedText } from '../components/themed-text'; // Theme-aware text component
import { IconSymbol } from '../components/ui/icon-symbol'; // SF Symbols icons
import { LeaderboardList } from '../components/leaderboard/LeaderboardList'; // Leaderboard display

// Constants and types
import { Colors } from '../constants/theme';
import type {
  LeaderboardMetric,
  LeaderboardPeriod,
  LeaderboardScope,
} from '../src/types/leaderboard';

// ============================================================================
// CONSTANTS - Filter options for leaderboard
// ============================================================================

/**
 * Available metrics for leaderboard ranking
 * Each metric has an associated icon and label for UI display
 */
const METRICS: { key: LeaderboardMetric; icon: string; label: string }[] = [
  { key: 'wordsLearned', icon: 'book.fill', label: 'Words' },
  { key: 'currentStreak', icon: 'flame.fill', label: 'Streak' },
  { key: 'accuracy', icon: 'checkmark.circle.fill', label: 'Accuracy' },
  { key: 'timeSpent', icon: 'clock.fill', label: 'Time' },
];

/**
 * Time period filters for leaderboard data
 * Determines the timeframe for ranking calculations
 */
const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'allTime', label: 'All Time' },
];

/**
 * Scope filters for leaderboard visibility
 * Controls whether to show global rankings or friends-only rankings
 */
const SCOPES: { key: LeaderboardScope; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'friends', label: 'Friends' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LeaderboardScreen - Competitive ranking screen for vocabulary learning
 *
 * Features:
 * - View rankings based on multiple metrics (words, streak, accuracy, time)
 * - Filter by time period (daily, weekly, monthly, all-time)
 * - Toggle between global and friends-only leaderboards
 * - Display user's current rank and percentile
 * - Pull-to-refresh functionality
 * - Highlight current user in the leaderboard
 * - Top 3 users shown with medal icons
 *
 * The leaderboard promotes engagement through friendly competition
 * and helps users track their progress relative to others.
 */
export default function LeaderboardScreen() {
  // --------------------------------------------------------------------------
  // HOOKS - Core functionality hooks
  // --------------------------------------------------------------------------

  // Internationalization hook for multi-language support
  const { t } = useTranslation();

  // Authentication context - provides current logged-in user data
  const { user } = useAuth();

  // Theme context - provides dark mode state for styling
  const { isDark } = useTheme();

  // Zustand leaderboard store - centralized state management for leaderboard data
  const {
    currentLeaderboard,     // Current leaderboard entries based on filters
    userPosition,           // Current user's rank and stats
    loading,                // Loading state for async operations
    currentMetric,          // Active metric filter
    currentPeriod,          // Active period filter
    currentScope,           // Active scope filter (global/friends)
    fetchLeaderboard,       // Action: Fetch leaderboard data
    fetchUserPosition,      // Action: Fetch user's position in leaderboard
    setFilter,              // Action: Update filter settings
  } = useLeaderboardStore();

  // --------------------------------------------------------------------------
  // LOCAL STATE - Component-level state management
  // --------------------------------------------------------------------------

  // Pull-to-refresh loading state
  const [refreshing, setRefreshing] = useState(false);

  // --------------------------------------------------------------------------
  // EFFECTS - Data fetching and side effects
  // --------------------------------------------------------------------------

  /**
   * Initial data fetch effect and filter change effect
   * Runs when component mounts or when any filter changes
   * Fetches both the leaderboard entries and the user's position
   */
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

  // --------------------------------------------------------------------------
  // HANDLERS - User interaction handlers
  // --------------------------------------------------------------------------

  /**
   * Handle pull-to-refresh gesture
   * Refreshes both leaderboard and user position data in parallel
   */
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

  /**
   * Handle metric filter change
   * Updates the leaderboard to rank by different metrics (words, streak, etc.)
   */
  const handleMetricChange = (metric: LeaderboardMetric) => {
    setFilter(metric, currentPeriod, currentScope);
  };

  /**
   * Handle period filter change
   * Updates the leaderboard timeframe (daily, weekly, monthly, all-time)
   */
  const handlePeriodChange = (period: LeaderboardPeriod) => {
    setFilter(currentMetric, period, currentScope);
  };

  /**
   * Handle scope filter change
   * Toggles between global leaderboard and friends-only leaderboard
   */
  const handleScopeChange = (scope: LeaderboardScope) => {
    setFilter(currentMetric, currentPeriod, scope);
  };

  /**
   * Get human-readable label for a metric
   * Helper function for displaying metric names in the UI
   */
  const getMetricLabel = (metric: LeaderboardMetric) => {
    return METRICS.find((m) => m.key === metric)?.label || 'Words';
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER - Component UI structure
  // --------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      {/* ============================================
          HEADER SECTION
          - Back button for navigation
          - Screen title
          - Refresh button (manual refresh)
          ============================================ */}
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

      {/* ============================================
          USER POSITION CARD
          - Shows current user's rank
          - Displays score for selected metric
          - Shows percentile (top X%)
          - Shows total participants count
          - Only visible when position data is available
          ============================================ */}
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

      {/* ============================================
          METRIC FILTERS SECTION
          - Horizontal scrollable filter chips
          - Four metric options: Words, Streak, Accuracy, Time
          - Active metric highlighted with blue background
          - Each chip shows an icon and label
          ============================================ */}
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

      {/* ============================================
          PERIOD AND SCOPE FILTERS SECTION
          - Two filter groups in a single row
          - Left: Period filters (Today, Week, Month, All Time)
          - Right: Scope filters (Global, Friends)
          - Active filter highlighted with blue tint
          ============================================ */}
      <View style={styles.filterRow}>
        {/* Period filter group */}
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

        {/* Scope filter group */}
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

      {/* ============================================
          LEADERBOARD LIST SECTION
          - Displays ranked list of users
          - Current user is highlighted
          - Top 3 users shown with medal icons
          - Shows loading state during data fetch
          ============================================ */}
      <View style={styles.content}>
        <LeaderboardList
          entries={currentLeaderboard?.entries || []}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Layout containers
  container: {
    flex: 1,
  },

  // Header section styles
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

  // User position card styles
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

  // Filter section styles
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
    color: '#fff', // White text on blue background for active metric
  },

  // Period and scope filter row styles
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

  // Scope filter styles
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
    color: '#fff', // White text on blue background for active scope
    fontWeight: '700',
  },

  // Content area
  content: {
    flex: 1,
  },
});
