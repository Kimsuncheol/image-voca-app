/**
 * =============================================================================
 * MEMBER DETAIL MODAL COMPONENT
 * =============================================================================
 * Full-screen modal for viewing and editing member details
 *
 * FEATURES:
 * - Full member profile with large avatar, name, and email
 * - Role management: View and edit user role (student/admin)
 * - Subscription management: View and edit subscription plan
 * - Detailed statistics: Streaks, words learned, quiz accuracy
 * - Activity tracking: Last active date and daily goal
 * - Loading states for initial data fetch and save operations
 * - Slide-up animation for modal presentation
 * - Theme-aware styling (dark/light mode)
 *
 * USER INTERACTIONS:
 * - Close button: Dismisses modal and returns to members list
 * - Edit role button: Enables role editing mode with student/admin toggle
 * - Edit plan button: Enables plan editing mode with plan selection
 * - Save buttons: Confirms changes and updates Firestore
 * - Cancel editing: Exits edit mode without saving changes
 *
 * EDIT MODES:
 * 1. View Mode (default):
 *    - Displays current values with pencil edit icons
 *    - All fields are read-only
 *
 * 2. Role Edit Mode:
 *    - Shows student/admin toggle buttons
 *    - Displays save/cancel buttons
 *    - Prevents closing modal during save operation
 *
 * 3. Plan Edit Mode:
 *    - Shows all available plans as selection buttons
 *    - Displays save/cancel buttons
 *    - Updates plan counts on successful save
 *
 * DATA FLOW:
 * 1. Parent opens modal and triggers member details fetch
 * 2. Modal receives member data via props
 * 3. User edits role or plan
 * 4. Modal calls parent's save handlers
 * 5. Parent updates Firestore and refreshes data
 * 6. Modal updates display with new values
 *
 * TECHNICAL DETAILS:
 * - Modal uses React Native's Modal component with slide animation
 * - Safe area insets ensure proper display on devices with notches
 * - Activity indicator shown during loading and save operations
 * - Empty state shown if member data fails to load
 * =============================================================================
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Member, SubscriptionPlan, UserRole } from '../../../src/types/member';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Subscription plan labels for display
 * Maps internal plan IDs to user-friendly names
 */
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: 'Free',
  voca_unlimited: 'Voca Unlimited',
  voca_speaking: 'Voca + Speaking',
};

/**
 * Subscription plan colors for badges
 * Consistent with MemberCard and StatsOverview
 */
const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: '#6c757d',
  voca_unlimited: '#007AFF',
  voca_speaking: '#28a745',
};

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface MemberDetailModalProps {
  /** Controls modal visibility */
  visible: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Member data to display (null if loading or error) */
  member: Member | null;

  /** Loading state for initial member details fetch */
  loading: boolean;

  /** Role editing mode flag */
  editingRole: boolean;

  /** Callback to toggle role editing mode */
  onToggleRoleEdit: (editing: boolean) => void;

  /** New role value during editing */
  newRole: UserRole;

  /** Callback when role selection changes */
  onRoleChange: (role: UserRole) => void;

  /** Callback to save role changes */
  onSaveRole: () => void;

  /** Plan editing mode flag */
  editingPlan: boolean;

  /** Callback to toggle plan editing mode */
  onTogglePlanEdit: (editing: boolean) => void;

  /** New plan value during editing */
  newPlan: SubscriptionPlan;

  /** Callback when plan selection changes */
  onPlanChange: (plan: SubscriptionPlan) => void;

  /** Callback to save plan changes */
  onSavePlan: () => void;

  /** Saving operation in progress flag */
  saving: boolean;

  /** Dark mode flag for theming */
  isDark: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * MemberDetailModal Component
 *
 * Full-screen slide-up modal displaying comprehensive member information
 * with inline editing capabilities for role and subscription plan.
 *
 * SECTIONS:
 * 1. Header: Close button, title, and spacer
 * 2. Profile: Avatar, name, and email
 * 3. Role Management: View/edit user role
 * 4. Subscription Management: View/edit subscription plan
 * 5. Stats Grid: Learning statistics in 2x2 grid
 * 6. Activity Info: Last active date and daily goal
 */
export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  visible,
  onClose,
  member,
  loading,
  editingRole,
  onToggleRoleEdit,
  newRole,
  onRoleChange,
  onSaveRole,
  editingPlan,
  onTogglePlanEdit,
  newPlan,
  onPlanChange,
  onSavePlan,
  saving,
  isDark,
}) => {
  const { t } = useTranslation();
  const styles = getStyles(isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* HEADER - Close button and title */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('admin.members.memberDetails')}</Text>
          <View style={{ width: 28 }} /> {/* Spacer for center alignment */}
        </View>

        {/* LOADING STATE */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
          </View>
        ) : member ? (
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* =================================================================
                PROFILE SECTION - Avatar, Name, Email
                ================================================================= */}
            <View style={styles.profileSection}>
              {/* Large Avatar */}
              <View style={styles.profileAvatar}>
                {member.photoURL ? (
                  <Image
                    source={{ uri: member.photoURL }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={48}
                    color={isDark ? '#666' : '#999'}
                  />
                )}
              </View>

              {/* Member Name */}
              <Text style={styles.profileName}>{member.displayName}</Text>

              {/* Member Email */}
              <Text style={styles.profileEmail}>{member.email}</Text>
            </View>

            {/* =================================================================
                ROLE MANAGEMENT SECTION
                ================================================================= */}
            <View style={styles.detailSection}>
              {/* Section Header with Edit Button */}
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{t('admin.members.role')}</Text>

                {!editingRole ? (
                  // Edit button - enters edit mode
                  <TouchableOpacity onPress={() => onToggleRoleEdit(true)}>
                    <Ionicons name="pencil" size={20} color="#007AFF" />
                  </TouchableOpacity>
                ) : (
                  // Cancel button - exits edit mode
                  <TouchableOpacity onPress={() => onToggleRoleEdit(false)}>
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              {editingRole ? (
                // EDIT MODE - Role selection buttons
                <View style={styles.editContainer}>
                  {/* Student/Admin Toggle Buttons */}
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        newRole === 'student' && styles.roleButtonActive,
                      ]}
                      onPress={() => onRoleChange('student')}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          newRole === 'student' && styles.roleButtonTextActive,
                        ]}
                      >
                        Student
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        newRole === 'admin' && styles.roleButtonActive,
                      ]}
                      onPress={() => onRoleChange('admin')}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          newRole === 'admin' && styles.roleButtonTextActive,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={onSaveRole}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {t('common.confirm')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // VIEW MODE - Current role badge
                <View style={styles.detailValue}>
                  <View
                    style={[
                      styles.roleBadge,
                      member.role === 'admin' && styles.adminRoleBadge,
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>
                      {member.role === 'admin' ? 'Admin' : 'Student'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* =================================================================
                SUBSCRIPTION MANAGEMENT SECTION
                ================================================================= */}
            <View style={styles.detailSection}>
              {/* Section Header with Edit Button */}
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>
                  {t('admin.members.subscription')}
                </Text>

                {!editingPlan ? (
                  // Edit button - enters edit mode
                  <TouchableOpacity onPress={() => onTogglePlanEdit(true)}>
                    <Ionicons name="pencil" size={20} color="#007AFF" />
                  </TouchableOpacity>
                ) : (
                  // Cancel button - exits edit mode
                  <TouchableOpacity onPress={() => onTogglePlanEdit(false)}>
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              {editingPlan ? (
                // EDIT MODE - Plan selection buttons
                <View style={styles.editContainer}>
                  {/* Plan Option Buttons */}
                  <View style={styles.planButtons}>
                    {(['free', 'voca_unlimited', 'voca_speaking'] as SubscriptionPlan[]).map(
                      (plan) => (
                        <TouchableOpacity
                          key={plan}
                          style={[
                            styles.planOptionButton,
                            newPlan === plan && styles.planOptionButtonActive,
                          ]}
                          onPress={() => onPlanChange(plan)}
                        >
                          <Text
                            style={[
                              styles.planOptionText,
                              newPlan === plan && styles.planOptionTextActive,
                            ]}
                          >
                            {PLAN_LABELS[plan]}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={onSavePlan}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {t('common.confirm')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // VIEW MODE - Current plan badge and metadata
                <View style={styles.detailValue}>
                  {/* Plan Badge */}
                  <View
                    style={[
                      styles.planBadgeLarge,
                      { backgroundColor: PLAN_COLORS[member.subscription.planId] },
                    ]}
                  >
                    <Text style={styles.planBadgeLargeText}>
                      {PLAN_LABELS[member.subscription.planId]}
                    </Text>
                  </View>

                  {/* Activation Date (if available) */}
                  {member.subscription.activatedAt && (
                    <Text style={styles.subscriptionInfo}>
                      {t('admin.members.activatedAt')}:{' '}
                      {new Date(member.subscription.activatedAt).toLocaleDateString()}
                    </Text>
                  )}

                  {/* Activated By Admin (if available) */}
                  {member.subscription.activatedBy && (
                    <Text style={styles.subscriptionInfo}>
                      {t('admin.members.activatedBy')}:{' '}
                      {member.subscription.activatedBy}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* =================================================================
                STATS GRID SECTION - Learning Statistics
                ================================================================= */}
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>{t('admin.members.stats')}</Text>

              {/* 2x2 Grid of Statistics */}
              <View style={styles.statsGrid}>
                {/* Current Streak */}
                <View style={styles.statGridItem}>
                  <Text style={styles.statGridNumber}>
                    {member.stats.currentStreak}
                  </Text>
                  <Text style={styles.statGridLabel}>
                    {t('admin.members.currentStreak')}
                  </Text>
                </View>

                {/* Longest Streak */}
                <View style={styles.statGridItem}>
                  <Text style={styles.statGridNumber}>
                    {member.stats.longestStreak}
                  </Text>
                  <Text style={styles.statGridLabel}>
                    {t('admin.members.longestStreak')}
                  </Text>
                </View>

                {/* Total Words Learned */}
                <View style={styles.statGridItem}>
                  <Text style={styles.statGridNumber}>
                    {member.stats.totalWordsLearned}
                  </Text>
                  <Text style={styles.statGridLabel}>
                    {t('admin.members.wordsLearned')}
                  </Text>
                </View>

                {/* Quiz Accuracy Percentage */}
                <View style={styles.statGridItem}>
                  <Text style={styles.statGridNumber}>
                    {member.stats.totalQuizAnswers > 0
                      ? Math.round(
                          (member.stats.totalCorrectAnswers /
                            member.stats.totalQuizAnswers) *
                            100
                        )
                      : 0}
                    %
                  </Text>
                  <Text style={styles.statGridLabel}>
                    {t('admin.members.accuracy')}
                  </Text>
                </View>
              </View>
            </View>

            {/* =================================================================
                ACTIVITY SECTION - Last Active and Daily Goal
                ================================================================= */}
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>{t('admin.members.activity')}</Text>

              {/* Last Active Date */}
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>
                  {t('admin.members.lastActive')}:
                </Text>
                <Text style={styles.activityValue}>
                  {member.stats.lastActiveDate
                    ? new Date(member.stats.lastActiveDate).toLocaleString()
                    : t('admin.members.neverActive')}
                </Text>
              </View>

              {/* Daily Goal */}
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>
                  {t('admin.members.dailyGoal')}:
                </Text>
                <Text style={styles.activityValue}>
                  {member.stats.dailyGoal} {t('common.words')}
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

/**
 * Dynamic styles based on theme
 *
 * STYLE ORGANIZATION:
 * 1. Modal Structure: Container, header, content
 * 2. Profile Section: Avatar and text
 * 3. Detail Sections: Generic section styling
 * 4. Role Management: Buttons and badges
 * 5. Subscription Management: Buttons and badges
 * 6. Stats Grid: 2x2 card layout
 * 7. Activity Info: Two-column info rows
 *
 * THEME VARIATIONS:
 * - Dark mode: Black background (#000) with light text
 * - Light mode: Light gray background (#f2f2f7) with dark text
 *
 * LAYOUT PATTERNS:
 * - Sections: Rounded cards with padding and margin
 * - Edit modes: Vertical stacking with gap spacing
 * - Buttons: Full-width with consistent height and padding
 * - Badges: Inline-flex with auto-sizing
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    // =========================================================================
    // MODAL STRUCTURE
    // =========================================================================
    modalContainer: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#f2f2f7',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#ddd',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    modalContent: {
      padding: 20,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // =========================================================================
    // PROFILE SECTION
    // =========================================================================
    profileSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    profileAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#333' : '#e5e5e5',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 12,
    },
    profileAvatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    profileName: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
    },
    profileEmail: {
      fontSize: 16,
      color: isDark ? '#999' : '#666',
      marginTop: 4,
    },

    // =========================================================================
    // DETAIL SECTIONS (Generic)
    // =========================================================================
    detailSection: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    detailHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    detailTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    detailValue: {},
    editContainer: {
      gap: 12,
    },

    // =========================================================================
    // ROLE MANAGEMENT
    // =========================================================================
    roleButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    roleButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: isDark ? '#333' : '#e5e5e5',
      alignItems: 'center',
    },
    roleButtonActive: {
      backgroundColor: '#007AFF',
    },
    roleButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ccc' : '#666',
    },
    roleButtonTextActive: {
      color: '#fff',
    },
    roleBadge: {
      backgroundColor: isDark ? '#333' : '#e5e5e5',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    adminRoleBadge: {
      backgroundColor: '#ff9500',
    },
    roleBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },

    // =========================================================================
    // SUBSCRIPTION MANAGEMENT
    // =========================================================================
    planButtons: {
      gap: 8,
    },
    planOptionButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: isDark ? '#333' : '#e5e5e5',
    },
    planOptionButtonActive: {
      backgroundColor: '#007AFF',
    },
    planOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ccc' : '#666',
    },
    planOptionTextActive: {
      color: '#fff',
    },
    planBadgeLarge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    planBadgeLargeText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    subscriptionInfo: {
      fontSize: 13,
      color: isDark ? '#999' : '#666',
      marginTop: 4,
    },

    // =========================================================================
    // SHARED SAVE BUTTON
    // =========================================================================
    saveButton: {
      backgroundColor: '#28a745',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: isDark ? '#333' : '#ccc',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },

    // =========================================================================
    // STATS GRID
    // =========================================================================
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
    },
    statGridItem: {
      width: '48%',
      backgroundColor: isDark ? '#333' : '#f5f5f5',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    statGridNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
    },
    statGridLabel: {
      fontSize: 12,
      color: isDark ? '#999' : '#666',
      marginTop: 4,
    },

    // =========================================================================
    // ACTIVITY INFO
    // =========================================================================
    activityInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#eee',
    },
    activityLabel: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
    },
    activityValue: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
      fontWeight: '500',
    },
  });
