import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { useFriendStore } from '../src/stores/friendStore';
import { ThemedText } from '../components/themed-text';
import { IconSymbol } from '../components/ui/icon-symbol';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { getUserProfile, getFriendship } from '../src/services/friendService';
import type { FriendProfile, Friendship } from '../src/types/friend';

export default function FriendProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { removeFriend, fetchFriends } = useFriendStore();

  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId || !user?.uid) return;

    try {
      setLoading(true);
      const [profileData, friendshipData] = await Promise.all([
        getUserProfile(userId),
        getFriendship(user.uid, userId),
      ]);
      setProfile(profileData);
      setFriendship(friendshipData);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('friends.error'), t('friends.loadProfileFailed'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    if (!friendship || !user?.uid || !profile) return;

    Alert.alert(
      t('friends.removeFriend'),
      t('friends.removeFriendConfirm', { name: profile.displayName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('friends.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendship.id, user.uid);
              Alert.alert(t('friends.success'), t('friends.friendRemoved'));
              router.back();
            } catch (error) {
              Alert.alert(t('friends.error'), t('friends.removeFailed'));
            }
          },
        },
      ]
    );
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText>{t('common.loading')}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            {t('friends.profile')}
          </ThemedText>
          <View style={{ width: 44 }} />
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
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
                size={48}
                color={isDark ? '#8e8e93' : '#636366'}
              />
            </View>
          )}
          <ThemedText type="title" style={styles.displayName}>
            {profile.displayName}
          </ThemedText>
          {profile.lastActiveDate && (
            <ThemedText style={styles.lastActive}>
              {t('friends.lastActive')}: {new Date(profile.lastActiveDate).toLocaleDateString()}
            </ThemedText>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('dashboard.stats.title')}
          </ThemedText>
          <View style={styles.statsGrid}>
            <DashboardCard
              title={t('dashboard.stats.wordsLearned')}
              value={profile.totalWordsLearned}
              icon="book.fill"
              color="#FF6B6B"
            />
            <DashboardCard
              title={t('dashboard.stats.streak')}
              value={profile.currentStreak}
              subtitle={t('dashboard.stats.days')}
              icon="flame.fill"
              color="#FFE66D"
            />
          </View>
        </View>

        {/* Actions */}
        {friendship?.status === 'accepted' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[
                styles.removeButton,
                { backgroundColor: isDark ? '#3a3a3c' : '#f5f5f5' },
              ]}
              onPress={handleRemoveFriend}
            >
              <IconSymbol
                name="person.badge.minus"
                size={20}
                color="#FF3B30"
              />
              <ThemedText style={[styles.removeButtonText, { color: '#FF3B30' }]}>
                {t('friends.removeFriend')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  lastActive: {
    fontSize: 14,
    opacity: 0.6,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
