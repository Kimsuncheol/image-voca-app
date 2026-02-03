import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';
import type { FriendRequestWithProfile } from '../../src/types/friend';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

interface FriendRequestsListProps {
  requests: FriendRequestWithProfile[];
  loading?: boolean;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  type: 'received' | 'sent';
}

export function FriendRequestsList({
  requests,
  loading = false,
  onAccept,
  onReject,
  type,
}: FriendRequestsListProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].tint} />
      </View>
    );
  }

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

  const renderRequest = ({ item }: { item: FriendRequestWithProfile }) => (
    <View
      style={[
        styles.requestCard,
        { backgroundColor: isDark ? '#1c1c1e' : '#f5f5f5' },
      ]}
    >
      <View style={styles.requestContent}>
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
        <View style={styles.userInfo}>
          <ThemedText style={styles.displayName}>
            {item.userProfile.displayName}
          </ThemedText>
          <ThemedText style={styles.requestDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>

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

      {type === 'sent' && (
        <View style={styles.pendingBadge}>
          <ThemedText style={styles.pendingText}>
            {t('friends.pending')}
          </ThemedText>
        </View>
      )}
    </View>
  );

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
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 13,
    opacity: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    // backgroundColor set dynamically based on theme
  },
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
