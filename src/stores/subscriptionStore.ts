import AsyncStorage from "@react-native-async-storage/async-storage";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";
import { UserRole } from "../types/member";
import { normalizeUserRole } from "../utils/role";

// Ad unlock is allowed for Days 4-10 only (Days 1-3 are free)
export const AD_UNLOCK_LIMIT = 10;
const UNLOCKED_IDS_KEY = "@unlocked_ids";

export type PlanType = "free" | "voca_unlimited" | "voca_speaking";

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  priceDisplay: string;
  features: string[];
  recommended?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceDisplay: "Free",
    features: ["Limited vocabulary access", "Speaking practice locked"],
  },
  {
    id: "voca_unlimited",
    name: "Voca Unlimited",
    price: 10_000,
    priceDisplay: "KRW 10,000",
    features: ["Unlimited vocabulary access", "Speaking practice locked"],
  },
  {
    id: "voca_speaking",
    name: "Voca + Speaking Unlimited",
    price: 25_000,
    priceDisplay: "KRW 25,000",
    features: ["Unlimited vocabulary access", "Speaking practice unlocked"],
    recommended: true,
  },
];

interface SubscriptionData {
  planId: PlanType;
  orderId?: string;
  updatedAt: string;
}

interface SubscriptionState {
  currentPlan: PlanType;
  orderId: string | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  unlockedIds: string[];
  currentUserId: string | null;
  fetchSubscription: (userId: string) => Promise<void>;
  updateSubscription: (
    userId: string,
    planId: PlanType,
    orderId: string,
  ) => Promise<void>;
  loadUnlockedIds: (userId: string) => Promise<void>;
  unlockViaAd: (userId: string, featureId: string) => Promise<void>;
  canAccessUnlimitedVoca: () => boolean;
  canAccessFeature: (featureId: string) => boolean;
  canAccessSpeaking: () => boolean;
  canUnlockViaAd: (day: number) => boolean;
  isAdmin: () => boolean;
  resetSubscription: () => void;
}

const normalizePlanId = (planId: unknown): PlanType => {
  if (planId === "voca_unlimited" || planId === "voca_speaking") {
    return planId;
  }
  return "free";
};

const buildSubscription = (
  planId: PlanType,
  orderId?: string,
): SubscriptionData => ({
  planId,
  ...(orderId && { orderId }),
  updatedAt: new Date().toISOString(),
});

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  currentPlan: "free",
  orderId: null,
  role: "student", // Default role for new users is 'student'
  loading: false,
  error: null,
  unlockedIds: [],
  currentUserId: null,

  fetchSubscription: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const subscription = data.subscription as
          | Partial<SubscriptionData>
          | undefined;
        const normalizedPlan = normalizePlanId(subscription?.planId);
        const orderId = subscription?.orderId ?? null;

        // Legacy "teacher" and unknown roles are normalized to "student".
        const role: UserRole = normalizeUserRole(data.role);

        console.log(
          "📋 Current User Role:",
          role,
          "| Raw role from Firestore:",
          data.role,
        );

        if (!subscription?.planId) {
          console.log("not subscription");
          await setDoc(
            userRef,
            {
              subscription: buildSubscription(
                normalizedPlan,
                orderId || undefined,
              ),
            },
            { merge: true },
          );
        }

        set({ currentPlan: normalizedPlan, orderId, role, loading: false });
      } else {
        // User document doesn't exist - create with default 'student' role
        const subscription = buildSubscription("free");
        await setDoc(userRef, { subscription }, { merge: true });
        set({
          currentPlan: "free",
          orderId: null,
          role: "student", // Default role for new users
          loading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to load subscription.",
        loading: false,
      });
      console.log(error.message);
    }
  },

  updateSubscription: async (
    userId: string,
    planId: PlanType,
    orderId: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const subscription = buildSubscription(planId, orderId);
      await setDoc(doc(db, "users", userId), { subscription }, { merge: true });
      set({ currentPlan: planId, orderId, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to update subscription.",
        loading: false,
      });
    }
  },

  loadUnlockedIds: async (userId: string) => {
    if (!userId) {
      console.warn("loadUnlockedIds called without userId");
      return;
    }

    set({ currentUserId: userId });
    const userCacheKey = `${UNLOCKED_IDS_KEY}_${userId}`;

    try {
      // First, try to load from Firestore (source of truth)
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      let unlockedDays: string[] = [];

      if (userDoc.exists()) {
        const data = userDoc.data();
        unlockedDays = data.unlockedDays || [];
      }

      // Filter out any unlocks beyond Day 10 (enforce limit)
      const validUnlocks = unlockedDays.filter((id) => {
        const match = id.match(/_day_(\d+)$/);
        if (match) {
          const day = parseInt(match[1], 10);
          return day <= AD_UNLOCK_LIMIT;
        }
        return true; // Keep non-day unlocks (e.g., speaking_feature)
      });

      set({ unlockedIds: validUnlocks });

      // Cache to AsyncStorage for offline access
      await AsyncStorage.setItem(userCacheKey, JSON.stringify(validUnlocks));
    } catch (error) {
      console.error("Failed to load unlocked IDs from Firestore:", error);
      // Fallback to cached AsyncStorage data
      try {
        const cached = await AsyncStorage.getItem(userCacheKey);
        if (cached) {
          set({ unlockedIds: JSON.parse(cached) });
        }
      } catch (cacheError) {
        console.error("Failed to load cached unlocked IDs:", cacheError);
      }
    }
  },

  unlockViaAd: async (userId: string, featureId: string) => {
    if (!userId) {
      console.warn("unlockViaAd called without userId");
      return;
    }

    // Validate the day is within ad unlock limit
    const match = featureId.match(/_day_(\d+)$/);
    if (match) {
      const day = parseInt(match[1], 10);
      if (day > AD_UNLOCK_LIMIT) {
        console.warn(
          `Cannot unlock Day ${day} via ad. Max is Day ${AD_UNLOCK_LIMIT}.`,
        );
        return;
      }
    }

    const currentIds = get().unlockedIds;
    if (currentIds.includes(featureId)) return; // Already unlocked

    const newUnlockedIds = [...currentIds, featureId];
    set({ unlockedIds: newUnlockedIds });

    const userCacheKey = `${UNLOCKED_IDS_KEY}_${userId}`;

    try {
      // Save to Firestore (source of truth)
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        unlockedDays: arrayUnion(featureId),
      });

      // Also cache locally
      await AsyncStorage.setItem(userCacheKey, JSON.stringify(newUnlockedIds));
    } catch (error) {
      console.error("Failed to persist unlocked ID to Firestore:", error);
      // Still try to cache locally as fallback
      try {
        await AsyncStorage.setItem(
          userCacheKey,
          JSON.stringify(newUnlockedIds),
        );
      } catch (cacheError) {
        console.error("Failed to cache unlocked ID:", cacheError);
      }
    }
  },

  canAccessUnlimitedVoca: () => {
    const { currentPlan, role } = get();
    // Admins have free premium access
    if (role.includes("admin")) return true;
    return currentPlan !== "free";
  },

  canAccessFeature: (featureId: string) => {
    const { currentPlan, unlockedIds, role } = get();
    // Admins have free premium access
    if (role.includes("admin")) return true;
    if (currentPlan !== "free") return true;
    return unlockedIds.includes(featureId);
  },

  canAccessSpeaking: () => {
    const { currentPlan, unlockedIds, role } = get();
    // Admins have free premium access
    if (role.includes("admin")) return true;
    return (
      currentPlan === "voca_speaking" ||
      unlockedIds.includes("speaking_feature")
    );
  },

  canUnlockViaAd: (day: number) => {
    return day > 3 && day <= AD_UNLOCK_LIMIT;
  },

  isAdmin: () => {
    const { role } = get();
    return role.includes("admin");
  },

  /**
   * Reset subscription state to defaults
   * Sets role back to 'student' (default role)
   */
  resetSubscription: () =>
    set({
      currentPlan: "free",
      orderId: null,
      role: "student", // Reset to default 'student' role
      loading: false,
      error: null,
      unlockedIds: [],
      currentUserId: null,
    }),
}));
