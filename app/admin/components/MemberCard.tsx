/**
 * =============================================================================
 * MEMBER CARD COMPONENT
 * =============================================================================
 * Individual member list item displaying profile, subscription, and stats
 *
 * FEATURES:
 * - Member profile with avatar, name, and email
 * - Admin badge indicator for users with admin role
 * - Subscription plan badge with color coding
 * - Quick stats: Current streak and total words learned
 * - Last active date timestamp
 * - Touchable to open detailed member view
 * - Theme-aware styling (dark/light mode)
 *
 * USER INTERACTIONS:
 * - Tap card: Opens member detail modal for full profile and editing
 *
 * LAYOUT STRUCTURE:
 * - Header Row: Avatar | Name & Email | Plan Badge
 * - Stats Row: Streak Icon | Words Icon | Last Active Date
 *
 * COLOR CODING:
 * - Free Plan: Gray (#6c757d)
 * - Voca Unlimited: Blue (#007AFF)
 * - Voca Speaking: Green (#28a745)
 * - Admin Badge: Orange (#ff9500)
 * - Streak Icon: Orange (#ff9500)
 * - Words Icon: Blue (#007AFF)
 *
 * DATA SOURCE:
 * Receives MemberListItem from parent, which contains aggregated data
 * from Firestore users collection and stats subcollection.
 * =============================================================================
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { MemberListItem } from '../../../src/types/member';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Color mapping for each subscription plan
 * Consistent with StatsOverview component colors
 */
const PLAN_COLORS = {
  free: '#6c757d',
  voca_unlimited: '#007AFF',
  voca_speaking: '#28a745',
} as const;

/**
 * Plan display labels
 * Short versions for compact badge display
 */
const PLAN_LABELS = {
  free: 'Free',
  voca_unlimited: 'Unlimited',
  voca_speaking: 'Speaking',
} as const;

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface MemberCardProps {
  /** Member data including profile, stats, and subscription info */
  member: MemberListItem;

  /** Callback fired when card is tapped */
  onPress: () => void;

  /** Dark mode flag for theming */
  isDark: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * MemberCard Component
 *
 * Displays a single member's summary information in a card format.
 * Card is divided into two sections:
 * 1. Header: Profile info (avatar, name, email) and subscription plan
 * 2. Stats: Learning statistics and last activity timestamp
 */
export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onPress,
  isDark,
}) => {
  const { t } = useTranslation();
  const styles = getStyles(isDark);

  /**
   * Format last active date for display
   * Falls back to "Never Active" if no date exists
   */
  const formattedLastActive = member.lastActiveDate
    ? new Date(member.lastActiveDate).toLocaleDateString()
    : t('admin.members.neverActive');

  return (
    <TouchableOpacity style={styles.memberCard} onPress={onPress}>
      {/* HEADER SECTION - Profile and Plan Info */}
      <View style={styles.memberHeader}>
        {/* Avatar - Shows photo or default person icon */}
        <View style={styles.memberAvatar}>
          {member.photoURL ? (
            <Image
              source={{ uri: member.photoURL }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons
              name="person"
              size={24}
              color={isDark ? '#666' : '#999'}
            />
          )}
        </View>

        {/* Member Info - Name, Email, and Admin Badge */}
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{member.displayName}</Text>

            {/* Admin Badge - Only shown for admin users */}
            {member.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          <Text style={styles.memberEmail}>{member.email}</Text>
        </View>

        {/* Plan Badge - Color-coded subscription tier */}
        <View
          style={[
            styles.planBadge,
            { backgroundColor: PLAN_COLORS[member.planId] },
          ]}
        >
          <Text style={styles.planBadgeText}>
            {PLAN_LABELS[member.planId]}
          </Text>
        </View>
      </View>

      {/* STATS SECTION - Learning Progress and Activity */}
      <View style={styles.memberStats}>
        {/* Current Streak with Fire Icon */}
        <View style={styles.memberStatItem}>
          <Ionicons name="flame" size={14} color="#ff9500" />
          <Text style={styles.memberStatText}>{member.currentStreak}</Text>
        </View>

        {/* Total Words Learned with Book Icon */}
        <View style={styles.memberStatItem}>
          <Ionicons name="book" size={14} color="#007AFF" />
          <Text style={styles.memberStatText}>
            {member.totalWordsLearned}
          </Text>
        </View>

        {/* Last Active Date - Right-aligned */}
        <Text style={styles.memberLastActive}>{formattedLastActive}</Text>
      </View>
    </TouchableOpacity>
  );
};

// =============================================================================
// STYLES
// =============================================================================

/**
 * Dynamic styles based on theme
 *
 * STYLE STRUCTURE:
 * - memberCard: Container with background, padding, and spacing
 * - memberHeader: Horizontal layout for avatar, info, and badge
 * - memberStats: Horizontal stats bar with divider above
 *
 * THEME VARIATIONS:
 * - Dark mode: Near-black card (#1a1a1a) with subtle borders
 * - Light mode: White card with light borders
 *
 * LAYOUT DETAILS:
 * - Avatar: 48x48 circle
 * - Plan badge: Auto-width with colored background
 * - Stats bar: Top border separator, icon+text pairs
 *
 * ACCESSIBILITY:
 * - Minimum touch target size (48px height via padding)
 * - Clear visual hierarchy with font sizes and weights
 * - High contrast text colors
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    memberCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    memberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    memberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? '#333' : '#e5e5e5',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    memberInfo: {
      flex: 1,
      marginLeft: 12,
    },
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    adminBadge: {
      backgroundColor: '#ff9500',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    adminBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    memberEmail: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
      marginTop: 2,
    },
    planBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    planBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    memberStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#eee',
      gap: 16,
    },
    memberStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    memberStatText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
    },
    memberLastActive: {
      marginLeft: 'auto',
      fontSize: 12,
      color: isDark ? '#666' : '#999',
    },
  });
