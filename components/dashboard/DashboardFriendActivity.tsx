import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useFriendStore } from '../../src/stores/friendStore';

export function DashboardFriendActivity() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const {
    friends,
    pendingRequestsReceived,
    fetchFriends,
    fetchPendingRequests
  } = useFriendStore();

  useEffect(() => {
    if (user?.uid) {
      fetchFriends(user.uid);
      fetchPendingRequests(user.uid);
    }
  }, [user?.uid]);

  // Don't show if user has no friends and no pending requests
  if (friends.length === 0 && pendingRequestsReceived.length === 0) {
    return null;
  }

  const topFriends = friends.slice(0, 3);
  const hasMoreFriends = friends.length > 3;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {t('dashboard.friendActivity.title')}
        </ThemedText>
        <TouchableOpacity onPress={() => router.push('/friends')}>
          <ThemedText style={[styles.seeAll, { color: '#007AFF' }]}>
            {t('dashboard.friendActivity.seeAll')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Pending Requests Banner */}
      {pendingRequestsReceived.length > 0 && (
        <TouchableOpacity
          style={[
            styles.requestsBanner,
            { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
          ]}
          onPress={() => router.push('/friends')}
        >
          <View style={[styles.requestsBadge, { backgroundColor: '#FF3B30' }]}>
            <ThemedText style={styles.requestsBadgeText}>
              {pendingRequestsReceived.length}
            </ThemedText>
          </View>
          <View style={styles.requestsInfo}>
            <ThemedText style={styles.requestsTitle}>
              {t('dashboard.friendActivity.newRequests')}
            </ThemedText>
            <ThemedText style={styles.requestsSubtitle}>
              {t('dashboard.friendActivity.tapToView')}
            </ThemedText>
          </View>
          <IconSymbol
            name="chevron.right"
            size={20}
            color={isDark ? '#8e8e93' : '#636366'}
          />
        </TouchableOpacity>
      )}

      {/* Top Friends */}
      {topFriends.length > 0 && (
        <View style={styles.friendsContainer}>
          {topFriends.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={[
                styles.friendCard,
                { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
              ]}
              onPress={() => router.push(`/friend-profile?userId=${friend.userProfile.uid}`)}
            >
              {friend.userProfile.photoURL ? (
                <Image
                  source={{ uri: friend.userProfile.photoURL }}
                  style={styles.friendAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.friendAvatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: isDark ? '#2c2c2e' : '#e0e0e0' },
                  ]}
                >
                  <IconSymbol
                    name="person.fill"
                    size={16}
                    color={isDark ? '#8e8e93' : '#636366'}
                  />
                </View>
              )}
              <ThemedText style={styles.friendName} numberOfLines={1}>
                {friend.userProfile.displayName}
              </ThemedText>
              <View style={styles.friendStat}>
                <IconSymbol name="flame.fill" size={12} color="#FFE66D" />
                <ThemedText style={styles.friendStatText}>
                  {friend.userProfile.currentStreak}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
          {hasMoreFriends && (
            <TouchableOpacity
              style={[
                styles.friendCard,
                styles.moreCard,
                {
                  backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: isDark ? '#3a3a3c' : '#d1d1d6',
                },
              ]}
              onPress={() => router.push('/friends')}
            >
              <ThemedText style={styles.moreText}>
                +{friends.length - 3}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  requestsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestsBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  requestsInfo: {
    flex: 1,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  requestsSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  friendsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  friendCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  friendStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendStatText: {
    fontSize: 12,
    opacity: 0.7,
  },
  moreCard: {
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.5,
  },
});
