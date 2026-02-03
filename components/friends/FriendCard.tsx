// ============================================================================
// IMPORTS
// ============================================================================

import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';
import type { FriendProfile } from '../../src/types/friend';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the FriendCard component
 *
 * @property friend - Friend's user profile with stats
 * @property onPress - Callback when card is tapped (optional)
 * @property onLongPress - Callback when card is long-pressed (optional)
 * @property showStats - Whether to display stats (streak, words learned)
 */
interface FriendCardProps {
  friend: FriendProfile;
  onPress?: () => void;
  onLongPress?: () => void;
  showStats?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FriendCard - Individual friend card component
 *
 * Features:
 * - Displays friend's profile photo or placeholder avatar
 * - Shows friend's display name
 * - Shows learning stats (streak and words learned) if enabled
 * - Supports tap gesture to view profile
 * - Supports long-press gesture to remove friend
 * - Chevron icon indicates card is pressable
 * - Theme-aware styling for dark/light modes
 *
 * This component is reusable across different friend-related views.
 */
export function FriendCard({ friend, onPress, onLongPress, showStats = true }: FriendCardProps) {
  const { isDark } = useTheme();

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={onPress || onLongPress ? 0.7 : 1}
    >
      {/* Left section: Avatar and user info */}
      <View style={styles.leftSection}>
        {/* Avatar: Photo or placeholder icon */}
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

        {/* User info: Name and stats */}
        <View style={styles.userInfo}>
          <ThemedText style={styles.displayName}>{friend.displayName}</ThemedText>

          {/* Stats row: Streak and words learned */}
          {showStats && (
            <View style={styles.statsRow}>
              {/* Current streak stat */}
              <View style={styles.statItem}>
                <IconSymbol
                  name="flame.fill"
                  size={14}
                  color="#FFE66D" // Yellow flame
                />
                <ThemedText style={styles.statText}>
                  {friend.currentStreak}
                </ThemedText>
              </View>

              {/* Total words learned stat */}
              <View style={styles.statItem}>
                <IconSymbol
                  name="book.fill"
                  size={14}
                  color="#FF6B6B" // Red book
                />
                <ThemedText style={styles.statText}>
                  {friend.totalWordsLearned}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Right section: Chevron indicator (only if card is pressable) */}
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

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main card container
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },

  // Left section container
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // Avatar styles
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24, // Circular avatar
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // User info styles
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  // Stats row styles
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
