/**
 * Friend System Types
 *
 * TypeScript interfaces for friend relationships and social features.
 */

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Represents a friendship relationship between two users
 */
export interface Friendship {
  id: string; // Document ID in Firestore
  fromUserId: string; // User who sent the friend request
  toUserId: string; // User who received the friend request
  status: FriendRequestStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  acceptedAt?: string; // ISO timestamp when accepted
}

/**
 * Public-facing friend profile information
 */
export interface FriendProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  currentStreak: number;
  totalWordsLearned: number;
  lastActiveDate: string;
}

/**
 * Friend request with additional user details for display
 */
export interface FriendRequestWithProfile extends Friendship {
  userProfile: FriendProfile; // Profile of the other user (sender for incoming, receiver for outgoing)
}

/**
 * Summary statistics for a user's friend network
 */
export interface FriendStats {
  totalFriends: number;
  pendingRequestsSent: number;
  pendingRequestsReceived: number;
}

/**
 * Represents a user in friend search results
 */
export interface UserSearchResult {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string; // Optional for search by email
  currentStreak?: number;
  totalWordsLearned?: number;
}
