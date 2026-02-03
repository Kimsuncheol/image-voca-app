// ============================================================================
// IMPORTS
// ============================================================================

import React from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { FriendCard } from './FriendCard';
import type { FriendRequestWithProfile } from '../../src/types/friend';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the FriendsList component
 *
 * @property friends - Array of friend relationships with user profiles
 * @property loading - Loading state indicator
 * @property onFriendPress - Callback when a friend card is tapped (navigates to profile)
 * @property onRemoveFriend - Callback when friend is long-pressed (removes friend)
 * @property emptyMessage - Custom message to display when list is empty
 */
interface FriendsListProps {
  friends: FriendRequestWithProfile[];
  loading?: boolean;
  onFriendPress?: (friend: FriendRequestWithProfile) => void;
  onRemoveFriend?: (friendshipId: string, friendName: string) => void;
  emptyMessage?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FriendsList - Displays a list of accepted friends
 *
 * Features:
 * - FlatList for efficient rendering of friend cards
 * - Shows loading spinner during data fetch
 * - Displays empty state message when no friends
 * - Supports tap to view friend profile
 * - Supports long-press to remove friend
 * - Each friend card shows stats (streak, words learned)
 *
 * This component is used in the "Friends" tab of the FriendsScreen.
 */
export function FriendsList({
  friends,
  loading = false,
  onFriendPress,
  onRemoveFriend,
  emptyMessage,
}: FriendsListProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------

  /**
   * Show centered loading spinner while friends data is being fetched
   */
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].tint} />
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------------------------------

  /**
   * Show empty state message when user has no friends
   * Displays custom message if provided, otherwise uses default translation
   */
  if (friends.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>
          {emptyMessage || t('friends.noFriends')}
        </ThemedText>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Handle long-press on a friend card
   * Triggers the remove friend confirmation dialog
   *
   * @param item - The friend relationship object with profile data
   */
  const handleLongPress = (item: FriendRequestWithProfile) => {
    if (onRemoveFriend) {
      onRemoveFriend(item.id, item.userProfile.displayName);
    }
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------

  /**
   * Render FlatList of friend cards
   * - Each card shows friend's profile with stats
   * - Tap to view profile
   * - Long-press to remove friend
   */
  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FriendCard
          friend={item.userProfile}
          onPress={onFriendPress ? () => onFriendPress(item) : undefined}
          onLongPress={() => handleLongPress(item)}
          showStats={true}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // List container padding
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Centered container for loading and empty states
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Empty state message
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
});
