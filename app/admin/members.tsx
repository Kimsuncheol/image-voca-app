/**
 * Member Administration Dashboard
 *
 * Admin screen for viewing and managing app members.
 * Includes member list, search, filtering, role management,
 * and subscription management.
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import {
  getAllMembers,
  getMemberDetails,
  updateMemberRole,
  updateMemberSubscription,
  getMemberCountsByPlan,
} from '../../src/services/memberService';
import type {
  MemberListItem,
  Member,
  SubscriptionPlan,
  UserRole,
} from '../../src/types/member';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../src/services/firebase';
import { useTranslation } from 'react-i18next';

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: 'Free',
  voca_unlimited: 'Voca Unlimited',
  voca_speaking: 'Voca + Speaking',
};

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: '#6c757d',
  voca_unlimited: '#007AFF',
  voca_speaking: '#28a745',
};

export default function MembersAdmin() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = getStyles(isDark);

  // Auth check
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Members list state
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<SubscriptionPlan | 'all'>('all');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  // Stats state
  const [planCounts, setPlanCounts] = useState<Record<SubscriptionPlan, number>>({
    free: 0,
    voca_unlimited: 0,
    voca_speaking: 0,
  });

  // Member detail modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Edit mode
  const [editingRole, setEditingRole] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>('free');
  const [saving, setSaving] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Admin check error:', error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Load members on mount
  useEffect(() => {
    if (isAdmin) {
      loadMembers();
      loadPlanCounts();
    }
  }, [isAdmin]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const allMembers = await getAllMembers();
      setMembers(allMembers);
    } catch (error) {
      console.error('Load members error:', error);
      Alert.alert(t('common.error'), t('admin.members.loadError'));
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadPlanCounts = async () => {
    try {
      const counts = await getMemberCountsByPlan();
      setPlanCounts(counts);
    } catch (error) {
      console.error('Load plan counts error:', error);
    }
  };

  const handleViewMember = async (uid: string) => {
    setLoadingDetails(true);
    setShowDetailModal(true);
    try {
      const details = await getMemberDetails(uid);
      if (details) {
        setSelectedMember(details);
        setNewRole(details.role);
        setNewPlan(details.subscription.planId);
      }
    } catch (error) {
      console.error('Load member details error:', error);
      Alert.alert(t('common.error'), t('admin.members.detailsError'));
      setShowDetailModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedMember) return;

    setSaving(true);
    try {
      await updateMemberRole(selectedMember.uid, newRole);
      setSelectedMember({ ...selectedMember, role: newRole });
      setEditingRole(false);

      // Update list
      setMembers((prev) =>
        prev.map((m) =>
          m.uid === selectedMember.uid ? { ...m, role: newRole } : m
        )
      );

      Alert.alert(t('common.success'), t('admin.members.roleUpdated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('admin.members.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = async () => {
    if (!selectedMember) return;

    setSaving(true);
    try {
      await updateMemberSubscription(selectedMember.uid, newPlan, true);
      setSelectedMember({
        ...selectedMember,
        subscription: { ...selectedMember.subscription, planId: newPlan },
      });
      setEditingPlan(false);

      // Update list
      setMembers((prev) =>
        prev.map((m) =>
          m.uid === selectedMember.uid ? { ...m, planId: newPlan } : m
        )
      );

      // Refresh counts
      loadPlanCounts();

      Alert.alert(t('common.success'), t('admin.members.planUpdated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('admin.members.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedMember(null);
    setEditingRole(false);
    setEditingPlan(false);
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = member.displayName.toLowerCase().includes(query);
        const matchesEmail = member.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Plan filter
      if (filterPlan !== 'all' && member.planId !== filterPlan) {
        return false;
      }

      // Role filter
      if (filterRole !== 'all' && member.role !== filterRole) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, filterPlan, filterRole]);

  const totalMembers = members.length;

  if (checkingAdmin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text style={styles.loadingText}>{t('admin.members.checkingPermissions')}</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: t('admin.members.accessDenied'),
            headerBackTitle: t('common.back'),
          }}
        />
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={64} color={isDark ? '#666' : '#ccc'} />
          <Text style={styles.errorTitle}>{t('admin.members.accessDenied')}</Text>
          <Text style={styles.errorText}>
            {t('admin.members.noPermission')}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: t('admin.members.title'),
          headerBackTitle: t('common.back'),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalMembers}</Text>
            <Text style={styles.statLabel}>{t('admin.members.totalMembers')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: PLAN_COLORS.voca_unlimited }]}>
              {planCounts.voca_unlimited}
            </Text>
            <Text style={styles.statLabel}>{t('admin.members.unlimited')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: PLAN_COLORS.voca_speaking }]}>
              {planCounts.voca_speaking}
            </Text>
            <Text style={styles.statLabel}>{t('admin.members.speaking')}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={isDark ? '#666' : '#999'} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('admin.members.searchPlaceholder')}
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>{t('admin.members.filter')}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filterPlan === 'all' && styles.filterChipActive]}
              onPress={() => setFilterPlan('all')}
            >
              <Text style={[styles.filterChipText, filterPlan === 'all' && styles.filterChipTextActive]}>
                {t('admin.members.allPlans')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterPlan === 'free' && styles.filterChipActive]}
              onPress={() => setFilterPlan('free')}
            >
              <Text style={[styles.filterChipText, filterPlan === 'free' && styles.filterChipTextActive]}>
                Free
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterPlan === 'voca_unlimited' && styles.filterChipActive]}
              onPress={() => setFilterPlan('voca_unlimited')}
            >
              <Text style={[styles.filterChipText, filterPlan === 'voca_unlimited' && styles.filterChipTextActive]}>
                Unlimited
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterPlan === 'voca_speaking' && styles.filterChipActive]}
              onPress={() => setFilterPlan('voca_speaking')}
            >
              <Text style={[styles.filterChipText, filterPlan === 'voca_speaking' && styles.filterChipTextActive]}>
                Speaking
              </Text>
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            <TouchableOpacity
              style={[styles.filterChip, filterRole === 'admin' && styles.filterChipActive]}
              onPress={() => setFilterRole(filterRole === 'admin' ? 'all' : 'admin')}
            >
              <Text style={[styles.filterChipText, filterRole === 'admin' && styles.filterChipTextActive]}>
                {t('admin.members.adminsOnly')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Members List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('admin.members.members')} ({filteredMembers.length})
            </Text>
            <TouchableOpacity onPress={loadMembers} disabled={loadingMembers}>
              <Ionicons
                name="refresh"
                size={24}
                color={isDark ? '#fff' : '#000'}
              />
            </TouchableOpacity>
          </View>

          {loadingMembers ? (
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
          ) : filteredMembers.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery ? t('admin.members.noResults') : t('admin.members.noMembers')}
            </Text>
          ) : (
            filteredMembers.map((member) => (
              <TouchableOpacity
                key={member.uid}
                style={styles.memberCard}
                onPress={() => handleViewMember(member.uid)}
              >
                <View style={styles.memberHeader}>
                  <View style={styles.memberAvatar}>
                    {member.photoURL ? (
                      <Image source={{ uri: member.photoURL }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={isDark ? '#666' : '#999'} />
                    )}
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      {member.role === 'admin' && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.planBadge,
                      { backgroundColor: PLAN_COLORS[member.planId] },
                    ]}
                  >
                    <Text style={styles.planBadgeText}>
                      {member.planId === 'free' ? 'Free' : member.planId === 'voca_unlimited' ? 'Unlimited' : 'Speaking'}
                    </Text>
                  </View>
                </View>
                <View style={styles.memberStats}>
                  <View style={styles.memberStatItem}>
                    <Ionicons name="flame" size={14} color="#ff9500" />
                    <Text style={styles.memberStatText}>{member.currentStreak}</Text>
                  </View>
                  <View style={styles.memberStatItem}>
                    <Ionicons name="book" size={14} color="#007AFF" />
                    <Text style={styles.memberStatText}>{member.totalWordsLearned}</Text>
                  </View>
                  <Text style={styles.memberLastActive}>
                    {member.lastActiveDate
                      ? new Date(member.lastActiveDate).toLocaleDateString()
                      : t('admin.members.neverActive')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Member Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('admin.members.memberDetails')}</Text>
            <View style={{ width: 28 }} />
          </View>

          {loadingDetails ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
            </View>
          ) : selectedMember ? (
            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <View style={styles.profileAvatar}>
                  {selectedMember.photoURL ? (
                    <Image source={{ uri: selectedMember.photoURL }} style={styles.profileAvatarImage} />
                  ) : (
                    <Ionicons name="person" size={48} color={isDark ? '#666' : '#999'} />
                  )}
                </View>
                <Text style={styles.profileName}>{selectedMember.displayName}</Text>
                <Text style={styles.profileEmail}>{selectedMember.email}</Text>
              </View>

              {/* Role Section */}
              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{t('admin.members.role')}</Text>
                  {!editingRole ? (
                    <TouchableOpacity onPress={() => setEditingRole(true)}>
                      <Ionicons name="pencil" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => setEditingRole(false)}>
                      <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
                {editingRole ? (
                  <View style={styles.editContainer}>
                    <View style={styles.roleButtons}>
                      <TouchableOpacity
                        style={[styles.roleButton, newRole === 'user' && styles.roleButtonActive]}
                        onPress={() => setNewRole('user')}
                      >
                        <Text style={[styles.roleButtonText, newRole === 'user' && styles.roleButtonTextActive]}>
                          User
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.roleButton, newRole === 'admin' && styles.roleButtonActive]}
                        onPress={() => setNewRole('admin')}
                      >
                        <Text style={[styles.roleButtonText, newRole === 'admin' && styles.roleButtonTextActive]}>
                          Admin
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[styles.saveButton, saving && styles.buttonDisabled]}
                      onPress={handleSaveRole}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>{t('common.confirm')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.detailValue}>
                    <View style={[styles.roleBadge, selectedMember.role === 'admin' && styles.adminRoleBadge]}>
                      <Text style={styles.roleBadgeText}>
                        {selectedMember.role === 'admin' ? 'Admin' : 'User'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Subscription Section */}
              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{t('admin.members.subscription')}</Text>
                  {!editingPlan ? (
                    <TouchableOpacity onPress={() => setEditingPlan(true)}>
                      <Ionicons name="pencil" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => setEditingPlan(false)}>
                      <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
                {editingPlan ? (
                  <View style={styles.editContainer}>
                    <View style={styles.planButtons}>
                      {(['free', 'voca_unlimited', 'voca_speaking'] as SubscriptionPlan[]).map((plan) => (
                        <TouchableOpacity
                          key={plan}
                          style={[styles.planOptionButton, newPlan === plan && styles.planOptionButtonActive]}
                          onPress={() => setNewPlan(plan)}
                        >
                          <Text style={[styles.planOptionText, newPlan === plan && styles.planOptionTextActive]}>
                            {PLAN_LABELS[plan]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[styles.saveButton, saving && styles.buttonDisabled]}
                      onPress={handleSavePlan}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>{t('common.confirm')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.detailValue}>
                    <View style={[styles.planBadgeLarge, { backgroundColor: PLAN_COLORS[selectedMember.subscription.planId] }]}>
                      <Text style={styles.planBadgeLargeText}>
                        {PLAN_LABELS[selectedMember.subscription.planId]}
                      </Text>
                    </View>
                    {selectedMember.subscription.activatedAt && (
                      <Text style={styles.subscriptionInfo}>
                        {t('admin.members.activatedAt')}: {new Date(selectedMember.subscription.activatedAt).toLocaleDateString()}
                      </Text>
                    )}
                    {selectedMember.subscription.activatedBy && (
                      <Text style={styles.subscriptionInfo}>
                        {t('admin.members.activatedBy')}: {selectedMember.subscription.activatedBy}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Stats Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{t('admin.members.stats')}</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridNumber}>{selectedMember.stats.currentStreak}</Text>
                    <Text style={styles.statGridLabel}>{t('admin.members.currentStreak')}</Text>
                  </View>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridNumber}>{selectedMember.stats.longestStreak}</Text>
                    <Text style={styles.statGridLabel}>{t('admin.members.longestStreak')}</Text>
                  </View>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridNumber}>{selectedMember.stats.totalWordsLearned}</Text>
                    <Text style={styles.statGridLabel}>{t('admin.members.wordsLearned')}</Text>
                  </View>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridNumber}>
                      {selectedMember.stats.totalQuizAnswers > 0
                        ? Math.round((selectedMember.stats.totalCorrectAnswers / selectedMember.stats.totalQuizAnswers) * 100)
                        : 0}%
                    </Text>
                    <Text style={styles.statGridLabel}>{t('admin.members.accuracy')}</Text>
                  </View>
                </View>
              </View>

              {/* Activity Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{t('admin.members.activity')}</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel}>{t('admin.members.lastActive')}:</Text>
                  <Text style={styles.activityValue}>
                    {selectedMember.stats.lastActiveDate
                      ? new Date(selectedMember.stats.lastActiveDate).toLocaleString()
                      : t('admin.members.neverActive')}
                  </Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel}>{t('admin.members.dailyGoal')}:</Text>
                  <Text style={styles.activityValue}>{selectedMember.stats.dailyGoal} {t('common.words')}</Text>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#f2f2f7',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? '#666' : '#999',
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
      marginBottom: 24,
    },
    backButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    backButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },

    // Stats
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

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },

    // Filters
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

    // Section
    section: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
      paddingVertical: 40,
    },

    // Member Card
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

    // Modal
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

    // Profile Section
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

    // Detail Section
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

    // Stats Grid
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

    // Activity
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
