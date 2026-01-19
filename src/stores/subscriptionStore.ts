import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";

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
  loading: boolean;
  error: string | null;
  unlockedIds: string[];
  fetchSubscription: (userId: string) => Promise<void>;
  updateSubscription: (
    userId: string,
    planId: PlanType,
    orderId: string
  ) => Promise<void>;
  loadUnlockedIds: () => Promise<void>;
  unlockViaAd: (featureId: string) => Promise<void>;
  canAccessUnlimitedVoca: () => boolean;
  canAccessFeature: (featureId: string) => boolean;
  canAccessSpeaking: () => boolean;
  canUnlockViaAd: (day: number) => boolean;
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
  orderId?: string
): SubscriptionData => ({
  planId,
  orderId,
  updatedAt: new Date().toISOString(),
});

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  currentPlan: "free",
  orderId: null,
  loading: false,
  error: null,

  unlockedIds: [],

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

        if (!subscription?.planId) {
          await setDoc(
            userRef,
            {
              subscription: buildSubscription(
                normalizedPlan,
                orderId ?? undefined
              ),
            },
            { merge: true }
          );
        }

        set({ currentPlan: normalizedPlan, orderId, loading: false });
      } else {
        const subscription = buildSubscription("free");
        await setDoc(userRef, { subscription }, { merge: true });
        set({ currentPlan: "free", orderId: null, loading: false });
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to load subscription.",
        loading: false,
      });
    }
  },

  updateSubscription: async (
    userId: string,
    planId: PlanType,
    orderId: string
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

  loadUnlockedIds: async () => {
    try {
      const stored = await AsyncStorage.getItem(UNLOCKED_IDS_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        // Filter out any unlocks beyond Day 10 (enforce new limit)
        const validUnlocks = parsed.filter((id) => {
          const match = id.match(/_day_(\d+)$/);
          if (match) {
            const day = parseInt(match[1], 10);
            return day <= AD_UNLOCK_LIMIT;
          }
          return true; // Keep non-day unlocks (e.g., speaking_feature)
        });
        set({ unlockedIds: validUnlocks });
        // Save filtered list back if any were removed
        if (validUnlocks.length !== parsed.length) {
          await AsyncStorage.setItem(
            UNLOCKED_IDS_KEY,
            JSON.stringify(validUnlocks)
          );
        }
      }
    } catch (error) {
      console.error("Failed to load unlocked IDs:", error);
    }
  },

  unlockViaAd: async (featureId: string) => {
    // Validate the day is within ad unlock limit
    const match = featureId.match(/_day_(\d+)$/);
    if (match) {
      const day = parseInt(match[1], 10);
      if (day > AD_UNLOCK_LIMIT) {
        console.warn(
          `Cannot unlock Day ${day} via ad. Max is Day ${AD_UNLOCK_LIMIT}.`
        );
        return;
      }
    }

    const currentIds = get().unlockedIds;
    if (currentIds.includes(featureId)) return; // Already unlocked

    const newUnlockedIds = [...currentIds, featureId];
    set({ unlockedIds: newUnlockedIds });

    try {
      await AsyncStorage.setItem(
        UNLOCKED_IDS_KEY,
        JSON.stringify(newUnlockedIds)
      );
    } catch (error) {
      console.error("Failed to persist unlocked ID:", error);
    }
  },

  canAccessUnlimitedVoca: () => {
    const { currentPlan } = get();
    return currentPlan !== "free";
  },

  canAccessFeature: (featureId: string) => {
    const { currentPlan, unlockedIds } = get();
    if (currentPlan !== "free") return true;
    return unlockedIds.includes(featureId);
  },

  canAccessSpeaking: () => {
    const { currentPlan, unlockedIds } = get();
    return (
      currentPlan === "voca_speaking" ||
      unlockedIds.includes("speaking_feature")
    );
  },

  canUnlockViaAd: (day: number) => {
    return day > 3 && day <= AD_UNLOCK_LIMIT;
  },

  resetSubscription: () =>
    set({
      currentPlan: "free",
      orderId: null,
      loading: false,
      error: null,
      unlockedIds: [],
    }),
}));
