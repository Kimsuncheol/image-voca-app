/**
 * Member Administration Types
 *
 * TypeScript interfaces for member management in the admin dashboard.
 */

export type UserRole = 'user' | 'admin';

export type SubscriptionPlan = 'free' | 'voca_unlimited' | 'voca_speaking';

export interface MemberSubscription {
  planId: SubscriptionPlan;
  isPermanent: boolean;
  expiresAt?: string;
  activatedAt?: string;
  activatedBy?: string; // 'payment' | 'promotion' | 'admin'
}

export interface MemberStats {
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  targetScore: number;
  totalWordsLearned: number;
  totalQuizAnswers: number;
  totalCorrectAnswers: number;
}

export interface Member {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  subscription: MemberSubscription;
  stats: MemberStats;
  createdAt: string;
  lastLoginAt?: string;
}

export interface MemberListItem {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  planId: SubscriptionPlan;
  lastActiveDate: string;
  currentStreak: number;
  totalWordsLearned: number;
}

export interface MemberFilter {
  role?: UserRole;
  plan?: SubscriptionPlan;
  searchQuery?: string;
}

export interface MemberUpdateRequest {
  role?: UserRole;
  subscription?: Partial<MemberSubscription>;
}
