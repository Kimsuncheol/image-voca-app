import { doc, getDoc, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";

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
    price: 50_000,
    priceDisplay: "KRW 50,000",
    features: ["Unlimited vocabulary access", "Speaking practice locked"],
  },
  {
    id: "voca_speaking",
    name: "Voca + Speaking Unlimited",
    price: 80_000,
    priceDisplay: "KRW 80,000",
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
  fetchSubscription: (userId: string) => Promise<void>;
  updateSubscription: (
    userId: string,
    planId: PlanType,
    orderId: string
  ) => Promise<void>;
  canAccessUnlimitedVoca: () => boolean;
  canAccessSpeaking: () => boolean;
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

  canAccessUnlimitedVoca: () => {
    const { currentPlan } = get();
    return currentPlan !== "free";
  },

  canAccessSpeaking: () => {
    const { currentPlan } = get();
    return currentPlan === "voca_speaking";
  },

  resetSubscription: () =>
    set({ currentPlan: "free", orderId: null, loading: false, error: null }),
}));
