/**
 * =============================================================================
 * STATS OVERVIEW COMPONENT
 * =============================================================================
 * Displays key member statistics in a horizontal card layout
 *
 * FEATURES:
 * - Shows total member count across all plans
 * - Displays Voca Unlimited plan member count with brand color
 * - Displays Voca Speaking plan member count with brand color
 * - Responsive card layout that adapts to screen size
 * - Theme-aware styling (dark/light mode)
 *
 * USAGE:
 * Used at the top of the admin members dashboard to provide a quick
 * overview of membership distribution across subscription plans.
 *
 * DATA FLOW:
 * - Receives member counts via props from parent component
 * - Parent fetches counts from Firestore via getMemberCountsByPlan service
 * - Updates automatically when members' plans change
 * =============================================================================
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Color mapping for each subscription plan
 * - free: Gray (#6c757d) - represents basic tier
 * - voca_unlimited: Blue (#007AFF) - iOS standard blue, represents premium
 * - voca_speaking: Green (#28a745) - represents highest tier with speaking features
 */
const PLAN_COLORS = {
  free: '#6c757d',
  voca_unlimited: '#007AFF',
  voca_speaking: '#28a745',
} as const;

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface StatsOverviewProps {
  /** Total number of members across all plans */
  totalMembers: number;

  /** Number of members with Voca Unlimited plan */
  unlimitedCount: number;

  /** Number of members with Voca Speaking plan */
  speakingCount: number;

  /** Dark mode flag for theming */
  isDark: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * StatsOverview Component
 *
 * Renders three stat cards in a horizontal row:
 * 1. Total Members - Shows overall count in default theme color
 * 2. Unlimited Plan - Shows count with blue accent color
 * 3. Speaking Plan - Shows count with green accent color
 *
 * Layout uses flexbox with equal spacing between cards.
 */
export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalMembers,
  unlimitedCount,
  speakingCount,
  isDark,
}) => {
  const { t } = useTranslation();
  const styles = getStyles(isDark);

  return (
    <View style={styles.statsContainer}>
      {/* Total Members Card */}
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{totalMembers}</Text>
        <Text style={styles.statLabel}>{t('admin.members.totalMembers')}</Text>
      </View>

      {/* Voca Unlimited Plan Card */}
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: PLAN_COLORS.voca_unlimited }]}>
          {unlimitedCount}
        </Text>
        <Text style={styles.statLabel}>{t('admin.members.unlimited')}</Text>
      </View>

      {/* Voca Speaking Plan Card */}
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: PLAN_COLORS.voca_speaking }]}>
          {speakingCount}
        </Text>
        <Text style={styles.statLabel}>{t('admin.members.speaking')}</Text>
      </View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

/**
 * Dynamic styles based on theme
 *
 * STYLE STRUCTURE:
 * - statsContainer: Horizontal flex container with gap for spacing
 * - statCard: Individual card with background, padding, and rounded corners
 * - statNumber: Large, bold number display
 * - statLabel: Small, muted label text below the number
 *
 * THEME VARIATIONS:
 * - Dark mode: Near-black cards (#1a1a1a) with white text
 * - Light mode: White cards with black text
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#999' : '#666',
      marginTop: 4,
    },
  });
