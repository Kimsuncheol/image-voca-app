/**
 * Member Service
 *
 * Service for managing members in the admin dashboard.
 * Provides CRUD operations for user management.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Member,
  MemberListItem,
  MemberUpdateRequest,
  MemberStats,
  MemberSubscription,
  SubscriptionPlan,
  UserRole,
} from '../types/member';
import { normalizeUserRole } from "../utils/role";

const USERS_COLLECTION = 'users';
const PAGE_SIZE = 20;

/**
 * Fetches a paginated list of members
 */
export async function getMembers(
  lastDoc?: DocumentSnapshot
): Promise<{ members: MemberListItem[]; lastDoc: DocumentSnapshot | null }> {
  try {
    let q = query(
      collection(db, USERS_COLLECTION),
      orderBy('lastActiveDate', 'desc'),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(
        collection(db, USERS_COLLECTION),
        orderBy('lastActiveDate', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
    }

    const snapshot = await getDocs(q);
    const members: MemberListItem[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const dailyStats = data.dailyStats || [];
      const totalWordsLearned = dailyStats.reduce(
        (sum: number, day: any) => sum + (day.wordsLearned || 0),
        0
      );
      const role = normalizeUserRole(data.role);

      members.push({
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.name || 'Unknown',
        photoURL: data.photoURL,
        role,
        planId: data.subscription?.planId || 'free',
        lastActiveDate: data.lastActiveDate || '',
        currentStreak: data.currentStreak || 0,
        totalWordsLearned,
      });
    });

    const newLastDoc = snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return { members, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
}

/**
 * Fetches all members (for search functionality)
 */
export async function getAllMembers(): Promise<MemberListItem[]> {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    const members: MemberListItem[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const dailyStats = data.dailyStats || [];
      const totalWordsLearned = dailyStats.reduce(
        (sum: number, day: any) => sum + (day.wordsLearned || 0),
        0
      );
      const role = normalizeUserRole(data.role);

      members.push({
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.name || 'Unknown',
        photoURL: data.photoURL,
        role,
        planId: data.subscription?.planId || 'free',
        lastActiveDate: data.lastActiveDate || '',
        currentStreak: data.currentStreak || 0,
        totalWordsLearned,
      });
    });

    return members.sort((a, b) => {
      if (!a.lastActiveDate) return 1;
      if (!b.lastActiveDate) return -1;
      return new Date(b.lastActiveDate).getTime() - new Date(a.lastActiveDate).getTime();
    });
  } catch (error) {
    console.error('Error fetching all members:', error);
    throw error;
  }
}

/**
 * Fetches detailed member information
 */
export async function getMemberDetails(uid: string): Promise<Member | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const dailyStats = data.dailyStats || [];

    // Calculate aggregate stats
    const totalWordsLearned = dailyStats.reduce(
      (sum: number, day: any) => sum + (day.wordsLearned || 0),
      0
    );
    const totalQuizAnswers = dailyStats.reduce(
      (sum: number, day: any) => sum + (day.totalAnswers || 0),
      0
    );
    const totalCorrectAnswers = dailyStats.reduce(
      (sum: number, day: any) => sum + (day.correctAnswers || 0),
      0
    );

    const stats: MemberStats = {
      dailyGoal: data.dailyGoal || 20,
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      lastActiveDate: data.lastActiveDate || '',
      targetScore: data.targetScore || 10,
      totalWordsLearned,
      totalQuizAnswers,
      totalCorrectAnswers,
    };

    const subscription: MemberSubscription = {
      planId: data.subscription?.planId || 'free',
      isPermanent: data.subscription?.isPermanent ?? true,
      expiresAt: data.subscription?.expiresAt,
      activatedAt: data.subscription?.activatedAt,
      activatedBy: data.subscription?.activatedBy,
    };
    const role = normalizeUserRole(data.role);

    return {
      uid: docSnap.id,
      email: data.email || '',
      displayName: data.displayName || data.name || 'Unknown',
      photoURL: data.photoURL,
      role,
      subscription,
      stats,
      createdAt: data.createdAt || '',
      lastLoginAt: data.lastLoginAt,
    };
  } catch (error) {
    console.error('Error fetching member details:', error);
    throw error;
  }
}

/**
 * Updates a member's role
 */
export async function updateMemberRole(uid: string, role: UserRole): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, { role });
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

/**
 * Updates a member's subscription
 */
export async function updateMemberSubscription(
  uid: string,
  planId: SubscriptionPlan,
  isPermanent: boolean = true,
  durationDays?: number
): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const subscription: MemberSubscription = {
      planId,
      isPermanent,
      activatedAt: new Date().toISOString(),
      activatedBy: 'admin',
    };

    if (!isPermanent && durationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      subscription.expiresAt = expiresAt.toISOString();
    }

    await updateDoc(docRef, { subscription });
  } catch (error) {
    console.error('Error updating member subscription:', error);
    throw error;
  }
}

/**
 * Updates a member with partial data
 */
export async function updateMember(
  uid: string,
  update: MemberUpdateRequest
): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const updateData: Record<string, any> = {};

    if (update.role !== undefined) {
      updateData.role = update.role;
    }

    if (update.subscription !== undefined) {
      const currentDoc = await getDoc(docRef);
      const currentSubscription = currentDoc.data()?.subscription || {};
      updateData.subscription = { ...currentSubscription, ...update.subscription };
    }

    if (Object.keys(updateData).length > 0) {
      await updateDoc(docRef, updateData);
    }
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
}

/**
 * Gets member counts by plan
 */
export async function getMemberCountsByPlan(): Promise<Record<SubscriptionPlan, number>> {
  try {
    const members = await getAllMembers();
    const counts: Record<SubscriptionPlan, number> = {
      free: 0,
      voca_unlimited: 0,
      voca_speaking: 0,
    };

    members.forEach((member) => {
      counts[member.planId] = (counts[member.planId] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error getting member counts:', error);
    throw error;
  }
}
