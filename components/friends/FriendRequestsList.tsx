// ============================================================================
// IMPORTS
// ============================================================================

import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';
import type { FriendRequestWithProfile } from '../../src/types/friend';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the FriendRequestsList component
 *
 * @property requests - Array of friend requests with user profiles
 * @property loading - Loading state indicator
 * @property onAccept - Callback to accept a received request
 * @property onReject - Callback to reject a received request
 * @property onCancel - Callback to cancel a sent request
 * @property type - Type of requests being displayed ('received' or 'sent')
 */
interface FriendRequestsListProps {
  requests: FriendRequestWithProfile[];
  loading?: boolean;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  type: 'received' | 'sent';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FriendRequestsList - Displays a list of friend requests (received or sent)
 *
 * Features:
 * - Shows loading spinner during data fetch
 * - Displays empty state with appropriate message
 * - Two display modes:
 *   1. Received: Shows accept (green) and reject (gray) buttons
 *   2. Sent: Shows cancel (gray) button
 * - Each request card shows profile photo and display name
 * - Shows request creation date
 * - FlatList for efficient rendering
 *
 * This component is used in both "Received" and "Sent" tabs of the FriendsScreen.
 */
export function FriendRequestsList({
  requests,
  loading = false,
  onAccept,
  onReject,
  onCancel,
  type,
}: FriendRequestsListProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------

  /**
   * Show centered loading spinner while requests data is being fetched
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
   * Show empty state message when there are no requests
   * Message varies based on type (received vs sent)
   */
  if (requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>
          {type === 'received'
            ? t('friends.noRequestsReceived')
            : t('friends.noRequestsSent')}
        </ThemedText>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Render individual friend request card
   * Shows different action buttons based on request type (received vs sent)
   *
   * @param item - Friend request object with user profile
   */
  const renderRequest = ({ item }: { item: FriendRequestWithProfile }) => (
    <View
      style={[
        styles.requestCard,
        { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
      ]}
    >
      {/* Request content: Avatar and user info */}
      <View style={styles.requestContent}>
        {/* Avatar: Photo or placeholder icon */}
        {item.userProfile.photoURL ? (
          <Image source={{ uri: item.userProfile.photoURL }} style={styles.avatar} />
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

        {/* User info: Name and request date */}
        <View style={styles.userInfo}>
          <ThemedText style={styles.displayName}>
            {item.userProfile.displayName}
          </ThemedText>
          <ThemedText style={styles.requestDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>

      {/* Action buttons for received requests: Accept (green) and Reject (gray) */}
      {type === 'received' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => onAccept?.(item.id)}
          >
            <IconSymbol name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.rejectButton,
              { backgroundColor: isDark ? '#3a3a3c' : '#d1d1d6' },
            ]}
            onPress={() => onReject?.(item.id)}
          >
            <IconSymbol
              name="xmark"
              size={20}
              color={isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Action button for sent requests: Cancel (gray) */}
      {type === 'sent' && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.cancelButton,
            { backgroundColor: isDark ? '#3a3a3c' : '#d1d1d6' },
          ]}
          onPress={() => onCancel?.(item.id)}
        >
          <IconSymbol
            name="xmark"
            size={20}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------

  /**
   * Render FlatList of friend request cards
   * Each card shows user info and action buttons based on request type
   */
  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={renderRequest}
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

  // Request card styles
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  requestContent: {
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
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 13,
    opacity: 0.5,
  },

  // Action button styles
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18, // Circular button
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759', // Green accept button
  },
  rejectButton: {
    // backgroundColor set dynamically based on theme
  },
  cancelButton: {
    // backgroundColor set dynamically based on theme
  },

  // Unused pending badge styles (kept for potential future use)
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFE66D50',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFE66D',
  },
});
