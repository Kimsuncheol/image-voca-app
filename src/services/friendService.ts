/**
 * Friend Service
 *
 * Service for managing friend relationships and social features.
 * Provides CRUD operations for friend requests, friendships, and user search.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  or,
  and,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Friendship,
  FriendProfile,
  FriendRequestWithProfile,
  FriendStats,
  UserSearchResult,
} from '../types/friend';

const USERS_COLLECTION = 'users';
const FRIENDSHIPS_COLLECTION = 'friendships';

/**
 * Sends a friend request from one user to another
 */
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<string> {
  try {
    // Check if friendship already exists
    const existing = await getFriendship(fromUserId, toUserId);
    if (existing) {
      throw new Error('Friend request already exists');
    }

    // Create friendship document
    const friendship: Omit<Friendship, 'id'> = {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, FRIENDSHIPS_COLLECTION), friendship);
    return docRef.id;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
}

/**
 * Accepts a friend request
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  try {
    const docRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
    await updateDoc(docRef, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
}

/**
 * Rejects a friend request
 */
export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  try {
    const docRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
    await updateDoc(docRef, {
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
}

/**
 * Removes a friend (deletes friendship)
 */
export async function removeFriend(friendshipId: string): Promise<void> {
  try {
    const docRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
}

/**
 * Gets a specific friendship between two users
 */
export async function getFriendship(
  userId1: string,
  userId2: string
): Promise<Friendship | null> {
  try {
    // Query for friendship in either direction
    const q = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      or(
        and(where('fromUserId', '==', userId1), where('toUserId', '==', userId2)),
        and(where('fromUserId', '==', userId2), where('toUserId', '==', userId1))
      )
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Friendship;
  } catch (error) {
    console.error('Error getting friendship:', error);
    throw error;
  }
}

/**
 * Gets all friends for a user (accepted friendships)
 */
export async function getFriends(userId: string): Promise<FriendRequestWithProfile[]> {
  try {
    // Query for all accepted friendships where user is either sender or receiver
    const q = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where('status', '==', 'accepted'),
      or(
        where('fromUserId', '==', userId),
        where('toUserId', '==', userId)
      )
    );

    const snapshot = await getDocs(q);
    const friends: FriendRequestWithProfile[] = [];

    // Fetch user profiles for all friends
    for (const docSnap of snapshot.docs) {
      const friendship = { id: docSnap.id, ...docSnap.data() } as Friendship;
      const friendUserId = friendship.fromUserId === userId
        ? friendship.toUserId
        : friendship.fromUserId;

      const profile = await getUserProfile(friendUserId);
      if (profile) {
        friends.push({
          ...friendship,
          userProfile: profile,
        });
      }
    }

    // Sort by most recent activity
    return friends.sort((a, b) => {
      const dateA = new Date(a.userProfile.lastActiveDate || 0).getTime();
      const dateB = new Date(b.userProfile.lastActiveDate || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    throw error;
  }
}

/**
 * Gets pending friend requests received by a user
 */
export async function getPendingRequestsReceived(
  userId: string
): Promise<FriendRequestWithProfile[]> {
  try {
    const q = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const requests: FriendRequestWithProfile[] = [];

    for (const docSnap of snapshot.docs) {
      const friendship = { id: docSnap.id, ...docSnap.data() } as Friendship;
      const profile = await getUserProfile(friendship.fromUserId);

      if (profile) {
        requests.push({
          ...friendship,
          userProfile: profile,
        });
      }
    }

    return requests;
  } catch (error) {
    console.error('Error fetching pending requests received:', error);
    throw error;
  }
}

/**
 * Gets pending friend requests sent by a user
 */
export async function getPendingRequestsSent(
  userId: string
): Promise<FriendRequestWithProfile[]> {
  try {
    const q = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where('fromUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const requests: FriendRequestWithProfile[] = [];

    for (const docSnap of snapshot.docs) {
      const friendship = { id: docSnap.id, ...docSnap.data() } as Friendship;
      const profile = await getUserProfile(friendship.toUserId);

      if (profile) {
        requests.push({
          ...friendship,
          userProfile: profile,
        });
      }
    }

    return requests;
  } catch (error) {
    console.error('Error fetching pending requests sent:', error);
    throw error;
  }
}

/**
 * Gets friend statistics for a user
 */
export async function getFriendStats(userId: string): Promise<FriendStats> {
  try {
    const [friends, requestsReceived, requestsSent] = await Promise.all([
      getFriends(userId),
      getPendingRequestsReceived(userId),
      getPendingRequestsSent(userId),
    ]);

    return {
      totalFriends: friends.length,
      pendingRequestsReceived: requestsReceived.length,
      pendingRequestsSent: requestsSent.length,
    };
  } catch (error) {
    console.error('Error fetching friend stats:', error);
    throw error;
  }
}

/**
 * Gets a public user profile for friend display
 */
export async function getUserProfile(userId: string): Promise<FriendProfile | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const dailyStats = data.dailyStats || [];
    const totalWordsLearned = dailyStats.reduce(
      (sum: number, day: any) => sum + (day.wordsLearned || 0),
      0
    );

    return {
      uid: docSnap.id,
      displayName: data.displayName || data.name || 'Unknown',
      photoURL: data.photoURL,
      currentStreak: data.currentStreak || 0,
      totalWordsLearned,
      lastActiveDate: data.lastActiveDate || '',
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Searches for users by display name or email
 */
export async function searchUsers(
  searchQuery: string,
  currentUserId: string,
  limitResults: number = 20
): Promise<UserSearchResult[]> {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    // Get all users (for client-side filtering)
    // Note: For production, consider using Algolia or similar for better search
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    const results: UserSearchResult[] = [];

    const lowerQuery = searchQuery.toLowerCase();

    for (const docSnap of snapshot.docs) {
      // Skip current user
      if (docSnap.id === currentUserId) {
        continue;
      }

      const data = docSnap.data();
      const displayName = (data.displayName || data.name || '').toLowerCase();
      const email = (data.email || '').toLowerCase();

      // Check if search query matches display name or email
      if (displayName.includes(lowerQuery) || email.includes(lowerQuery)) {
        const dailyStats = data.dailyStats || [];
        const totalWordsLearned = dailyStats.reduce(
          (sum: number, day: any) => sum + (day.wordsLearned || 0),
          0
        );

        results.push({
          uid: docSnap.id,
          displayName: data.displayName || data.name || 'Unknown',
          photoURL: data.photoURL,
          email: data.email,
          currentStreak: data.currentStreak || 0,
          totalWordsLearned,
        });
      }

      // Limit results
      if (results.length >= limitResults) {
        break;
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Checks if two users are friends
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  try {
    const friendship = await getFriendship(userId1, userId2);
    return friendship !== null && friendship.status === 'accepted';
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return false;
  }
}
