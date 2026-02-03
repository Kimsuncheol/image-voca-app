/**
 * Friend Store
 *
 * Zustand store for managing friend state, requests, and social features.
 */

import { create } from 'zustand';
import type {
  FriendProfile,
  FriendRequestWithProfile,
  FriendStats,
  UserSearchResult,
} from '../types/friend';
import * as friendService from '../services/friendService';

interface FriendState {
  // State
  friends: FriendRequestWithProfile[];
  pendingRequestsReceived: FriendRequestWithProfile[];
  pendingRequestsSent: FriendRequestWithProfile[];
  friendStats: FriendStats | null;
  searchResults: UserSearchResult[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchFriends: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  fetchFriendStats: (userId: string) => Promise<void>;
  sendFriendRequest: (fromUserId: string, toUserId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string, userId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string, userId: string) => Promise<void>;
  removeFriend: (friendshipId: string, userId: string) => Promise<void>;
  searchUsers: (query: string, currentUserId: string) => Promise<void>;
  clearSearchResults: () => void;
  reset: () => void;
}

const initialState = {
  friends: [],
  pendingRequestsReceived: [],
  pendingRequestsSent: [],
  friendStats: null,
  searchResults: [],
  loading: false,
  error: null,
};

export const useFriendStore = create<FriendState>((set, get) => ({
  ...initialState,

  /**
   * Fetches all friends for a user
   */
  fetchFriends: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const friends = await friendService.getFriends(userId);
      set({ friends, loading: false });
    } catch (error) {
      console.error('Error fetching friends:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch friends',
        loading: false,
      });
    }
  },

  /**
   * Fetches pending friend requests
   */
  fetchPendingRequests: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const [received, sent] = await Promise.all([
        friendService.getPendingRequestsReceived(userId),
        friendService.getPendingRequestsSent(userId),
      ]);
      set({
        pendingRequestsReceived: received,
        pendingRequestsSent: sent,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch requests',
        loading: false,
      });
    }
  },

  /**
   * Fetches friend statistics
   */
  fetchFriendStats: async (userId: string) => {
    try {
      const stats = await friendService.getFriendStats(userId);
      set({ friendStats: stats });
    } catch (error) {
      console.error('Error fetching friend stats:', error);
    }
  },

  /**
   * Sends a friend request
   */
  sendFriendRequest: async (fromUserId: string, toUserId: string) => {
    try {
      set({ loading: true, error: null });
      await friendService.sendFriendRequest(fromUserId, toUserId);

      // Refresh pending requests and stats
      await get().fetchPendingRequests(fromUserId);
      await get().fetchFriendStats(fromUserId);

      set({ loading: false });
    } catch (error) {
      console.error('Error sending friend request:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to send friend request',
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Accepts a friend request
   */
  acceptFriendRequest: async (friendshipId: string, userId: string) => {
    try {
      set({ loading: true, error: null });
      await friendService.acceptFriendRequest(friendshipId);

      // Refresh friends, pending requests, and stats
      await Promise.all([
        get().fetchFriends(userId),
        get().fetchPendingRequests(userId),
        get().fetchFriendStats(userId),
      ]);

      set({ loading: false });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to accept request',
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Rejects a friend request
   */
  rejectFriendRequest: async (friendshipId: string, userId: string) => {
    try {
      set({ loading: true, error: null });
      await friendService.rejectFriendRequest(friendshipId);

      // Refresh pending requests and stats
      await get().fetchPendingRequests(userId);
      await get().fetchFriendStats(userId);

      set({ loading: false });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to reject request',
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Removes a friend
   */
  removeFriend: async (friendshipId: string, userId: string) => {
    try {
      set({ loading: true, error: null });
      await friendService.removeFriend(friendshipId);

      // Refresh friends and stats
      await Promise.all([
        get().fetchFriends(userId),
        get().fetchFriendStats(userId),
      ]);

      set({ loading: false });
    } catch (error) {
      console.error('Error removing friend:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to remove friend',
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Searches for users
   */
  searchUsers: async (query: string, currentUserId: string) => {
    try {
      set({ loading: true, error: null });
      const results = await friendService.searchUsers(query, currentUserId);
      set({ searchResults: results, loading: false });
    } catch (error) {
      console.error('Error searching users:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to search users',
        searchResults: [],
        loading: false,
      });
    }
  },

  /**
   * Clears search results
   */
  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  /**
   * Resets the store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));
