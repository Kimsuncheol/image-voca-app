import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';
import type { FriendProfile } from '../../src/types/friend';

interface FriendCardProps {
  friend: FriendProfile;
  onPress?: () => void;
  showStats?: boolean;
}

export function FriendCard({ friend, onPress, showStats = true }: FriendCardProps) {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.leftSection}>
        {friend.photoURL ? (
          <Image source={{ uri: friend.photoURL }} style={styles.avatar} />
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
              size={24}
              color={isDark ? '#8e8e93' : '#636366'}
            />
          </View>
        )}
        <View style={styles.userInfo}>
          <ThemedText style={styles.displayName}>{friend.displayName}</ThemedText>
          {showStats && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <IconSymbol
                  name="flame.fill"
                  size={14}
                  color="#FFE66D"
                />
                <ThemedText style={styles.statText}>
                  {friend.currentStreak}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  name="book.fill"
                  size={14}
                  color="#FF6B6B"
                />
                <ThemedText style={styles.statText}>
                  {friend.totalWordsLearned}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </View>
      {onPress && (
        <IconSymbol
          name="chevron.right"
          size={20}
          color={isDark ? '#8e8e93' : '#636366'}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    opacity: 0.7,
  },
});
