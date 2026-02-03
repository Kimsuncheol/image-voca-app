import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { useFriendStore } from '../src/stores/friendStore';
import { ThemedText } from '../components/themed-text';
import { IconSymbol } from '../components/ui/icon-symbol';
import { FriendsList } from '../components/friends/FriendsList';
import { FriendRequestsList } from '../components/friends/FriendRequestsList';
import { Colors } from '../constants/theme';
import type { UserSearchResult } from '../src/types/friend';

type TabType = 'friends' | 'received' | 'sent';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const {
    friends,
    pendingRequestsReceived,
    pendingRequestsSent,
    searchResults,
    loading,
    fetchFriends,
    fetchPendingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    searchUsers,
    clearSearchResults,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (user?.uid) {
      fetchFriends(user.uid);
      fetchPendingRequests(user.uid);
    }
  }, [user?.uid]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !user?.uid) return;

    setIsSearching(true);
    await searchUsers(searchQuery, user.uid);
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearchResults();
  };

  const handleSendRequest = async (toUserId: string) => {
    if (!user?.uid) return;

    try {
      await sendFriendRequest(user.uid, toUserId);
      Alert.alert(
        t('friends.success'),
        t('friends.requestSent')
      );
      handleClearSearch();
    } catch (error) {
      Alert.alert(
        t('friends.error'),
        error instanceof Error ? error.message : t('friends.requestFailed')
      );
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await acceptFriendRequest(requestId, user.uid);
      Alert.alert(
        t('friends.success'),
        t('friends.requestAccepted')
      );
    } catch (error) {
      Alert.alert(
        t('friends.error'),
        t('friends.acceptFailed')
      );
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await rejectFriendRequest(requestId, user.uid);
    } catch (error) {
      Alert.alert(
        t('friends.error'),
        t('friends.rejectFailed')
      );
    }
  };

  const handleRemoveFriend = (friendshipId: string, friendName: string) => {
    Alert.alert(
      t('friends.removeFriend'),
      t('friends.removeFriendConfirm', { name: friendName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('friends.remove'),
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await removeFriend(friendshipId, user.uid);
              Alert.alert(t('friends.success'), t('friends.friendRemoved'));
            } catch (error) {
              Alert.alert(t('friends.error'), t('friends.removeFailed'));
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = (requestId: string) => {
    Alert.alert(
      t('friends.cancelRequest'),
      t('friends.cancelRequestConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('friends.cancelButton'),
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await removeFriend(requestId, user.uid);
            } catch (error) {
              Alert.alert(t('friends.error'), t('friends.cancelFailed'));
            }
          },
        },
      ]
    );
  };

  const handleViewFriendProfile = (friendUserId: string) => {
    router.push(`/friend-profile?userId=${friendUserId}`);
  };

  const renderSearchResults = () => (
    <ScrollView style={styles.searchResults}>
      {searchResults.map((result) => (
        <View
          key={result.uid}
          style={[
            styles.searchResultCard,
            { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
          ]}
        >
          <View style={styles.searchResultInfo}>
            <ThemedText style={styles.searchResultName}>
              {result.displayName}
            </ThemedText>
            <ThemedText style={styles.searchResultEmail}>
              {result.email}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendRequest(result.uid)}
          >
            <IconSymbol name="person.badge.plus" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      ))}
      {searchResults.length === 0 && !loading && (
        <ThemedText style={styles.noResults}>
          {t('friends.noUsersFound')}
        </ThemedText>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    if (searchResults.length > 0) {
      return renderSearchResults();
    }

    switch (activeTab) {
      case 'friends':
        return (
          <FriendsList
            friends={friends}
            loading={loading}
            onFriendPress={(friend) => handleViewFriendProfile(friend.userProfile.uid)}
            onRemoveFriend={handleRemoveFriend}
          />
        );
      case 'received':
        return (
          <FriendRequestsList
            requests={pendingRequestsReceived}
            loading={loading}
            type="received"
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        );
      case 'sent':
        return (
          <FriendRequestsList
            requests={pendingRequestsSent}
            loading={loading}
            type="sent"
            onCancel={handleCancelRequest}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            {t('friends.title')}
          </ThemedText>
          <View style={{ width: 44 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
            ]}
          >
            <IconSymbol
              name="magnifyingglass"
              size={20}
              color={isDark ? '#8e8e93' : '#636366'}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? '#fff' : '#000' },
              ]}
              placeholder={t('friends.searchPlaceholder')}
              placeholderTextColor={isDark ? '#8e8e93' : '#636366'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={20}
                  color={isDark ? '#8e8e93' : '#636366'}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={!searchQuery.trim()}
          >
            <ThemedText style={styles.searchButtonText}>
              {t('friends.search')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        {searchResults.length === 0 && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'friends' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('friends')}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === 'friends' && styles.activeTabText,
                ]}
              >
                {t('friends.myFriends')}
              </ThemedText>
              {friends.length > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{friends.length}</ThemedText>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'received' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('received')}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === 'received' && styles.activeTabText,
                ]}
              >
                {t('friends.received')}
              </ThemedText>
              {pendingRequestsReceived.length > 0 && (
                <View style={[styles.badge, styles.notificationBadge]}>
                  <ThemedText style={styles.badgeText}>
                    {pendingRequestsReceived.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'sent' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('sent')}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === 'sent' && styles.activeTabText,
                ]}
              >
                {t('friends.sent')}
              </ThemedText>
              {pendingRequestsSent.length > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {pendingRequestsSent.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>{renderTabContent()}</View>
      </KeyboardAvoidingView>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
  },
  activeTabText: {
    opacity: 1,
    color: '#007AFF',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#8e8e93',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: '#FF3B30',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 13,
    opacity: 0.6,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.6,
  },
});
