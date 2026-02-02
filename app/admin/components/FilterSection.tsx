/**
 * =============================================================================
 * FILTER SECTION COMPONENT
 * =============================================================================
 * Horizontal scrollable filter chips for member list filtering
 *
 * FEATURES:
 * - Filter by subscription plan (All, Free, Unlimited, Speaking)
 * - Filter by user role (toggle for Admins Only)
 * - Visual divider separating plan and role filters
 * - Horizontal scroll for better mobile UX
 * - Active state highlighting with brand color
 * - Theme-aware styling (dark/light mode)
 *
 * USER INTERACTIONS:
 * - Tap plan chip: Filters members by selected plan
 * - Tap "All Plans": Shows members from all plans
 * - Tap "Admins Only": Toggles between showing all users and admins only
 *
 * FILTER LOGIC:
 * - Plan filters are mutually exclusive (only one active at a time)
 * - Role filter is a toggle (on/off for admin-only view)
 * - Filters combine with search query in parent component
 *
 * TECHNICAL DETAILS:
 * - Uses TypeScript union types for type-safe filter values
 * - Controlled component pattern for both filter states
 * - No internal state - all state managed by parent
 * =============================================================================
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPlan, UserRole } from '../../../src/types/member';

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface FilterSectionProps {
  /** Currently selected plan filter ('all' or specific plan) */
  selectedPlan: SubscriptionPlan | 'all';

  /** Callback when plan filter changes */
  onPlanChange: (plan: SubscriptionPlan | 'all') => void;

  /** Currently selected role filter ('all' or 'admin') */
  selectedRole: UserRole | 'all';

  /** Callback when role filter changes */
  onRoleChange: (role: UserRole | 'all') => void;

  /** Dark mode flag for theming */
  isDark: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * FilterSection Component
 *
 * Renders two groups of filter chips:
 * 1. Plan Filters: All Plans | Free | Unlimited | Speaking
 * 2. Role Filter: Admins Only (toggle)
 *
 * Groups are separated by a vertical divider for visual clarity.
 * Horizontal scrolling ensures all filters are accessible on small screens.
 */
export const FilterSection: React.FC<FilterSectionProps> = ({
  selectedPlan,
  onPlanChange,
  selectedRole,
  onRoleChange,
  isDark,
}) => {
  const { t } = useTranslation();
  const styles = getStyles(isDark);

  /**
   * Handle admin role filter toggle
   * Switches between showing all users and admins only
   */
  const handleAdminToggle = () => {
    onRoleChange(selectedRole === 'admin' ? 'all' : 'admin');
  };

  return (
    <View style={styles.filtersContainer}>
      {/* Filter Label */}
      <Text style={styles.filterLabel}>{t('admin.members.filter')}:</Text>

      {/* Scrollable Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* PLAN FILTERS */}

        {/* All Plans Chip */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedPlan === 'all' && styles.filterChipActive,
          ]}
          onPress={() => onPlanChange('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedPlan === 'all' && styles.filterChipTextActive,
            ]}
          >
            {t('admin.members.allPlans')}
          </Text>
        </TouchableOpacity>

        {/* Free Plan Chip */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedPlan === 'free' && styles.filterChipActive,
          ]}
          onPress={() => onPlanChange('free')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedPlan === 'free' && styles.filterChipTextActive,
            ]}
          >
            Free
          </Text>
        </TouchableOpacity>

        {/* Unlimited Plan Chip */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedPlan === 'voca_unlimited' && styles.filterChipActive,
          ]}
          onPress={() => onPlanChange('voca_unlimited')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedPlan === 'voca_unlimited' && styles.filterChipTextActive,
            ]}
          >
            Unlimited
          </Text>
        </TouchableOpacity>

        {/* Speaking Plan Chip */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedPlan === 'voca_speaking' && styles.filterChipActive,
          ]}
          onPress={() => onPlanChange('voca_speaking')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedPlan === 'voca_speaking' && styles.filterChipTextActive,
            ]}
          >
            Speaking
          </Text>
        </TouchableOpacity>

        {/* DIVIDER - Separates plan and role filters */}
        <View style={styles.filterDivider} />

        {/* ROLE FILTER */}

        {/* Admins Only Toggle Chip */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedRole === 'admin' && styles.filterChipActive,
          ]}
          onPress={handleAdminToggle}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedRole === 'admin' && styles.filterChipTextActive,
            ]}
          >
            {t('admin.members.adminsOnly')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
 * - filtersContainer: Horizontal layout with label and scrollable chips
 * - filterLabel: Static "Filter:" text label
 * - filterChip: Individual chip button with rounded corners
 * - filterChipActive: Active state with brand blue background
 * - filterDivider: Vertical line separating filter groups
 *
 * THEME VARIATIONS:
 * - Dark mode: Dark gray chips (#1a1a1a) with muted text
 * - Light mode: Light gray chips (#e5e5e5) with darker text
 * - Active state: Blue (#007AFF) with white text in both modes
 *
 * ACCESSIBILITY:
 * - 8px gap between chips for comfortable touch targets
 * - Minimum touch target size via padding (16px horizontal, 8px vertical)
 * - Clear visual feedback for active state
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    filtersContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    filterLabel: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#1a1a1a' : '#e5e5e5',
      marginRight: 8,
    },
    filterChipActive: {
      backgroundColor: '#007AFF',
    },
    filterChipText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
    },
    filterChipTextActive: {
      color: '#fff',
    },
    filterDivider: {
      width: 1,
      height: 20,
      backgroundColor: isDark ? '#333' : '#ddd',
      marginHorizontal: 8,
    },
  });
