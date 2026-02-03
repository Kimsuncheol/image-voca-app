import React from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { FriendCard } from './FriendCard';
import type { FriendRequestWithProfile } from '../../src/types/friend';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

interface FriendsListProps {
  friends: FriendRequestWithProfile[];
  loading?: boolean;
  onFriendPress?: (friend: FriendRequestWithProfile) => void;
  emptyMessage?: string;
}

export function FriendsList({
  friends,
  loading = false,
  onFriendPress,
  emptyMessage,
}: FriendsListProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].tint} />
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>
          {emptyMessage || t('friends.noFriends')}
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FriendCard
          friend={item.userProfile}
          onPress={onFriendPress ? () => onFriendPress(item) : undefined}
          showStats={true}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
});
