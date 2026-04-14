import { doc, getDoc, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";
import type { UserRole } from "../types/userRole";
import { normalizeUserRole } from "../utils/role";

export type PlanType = "free" | "voca_unlimited";
type LegacyStoredPlanId = PlanType | "voca_speaking";

export interface Plan {
  id: PlanType;
  name: string;
  features: string[];
  recommended?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    features: ["Limited vocabulary access"],
  },
  {
    id: "voca_unlimited",
    name: "Voca Unlimited",
    features: ["Unlimited vocabulary access"],
    recommended: true,
  },
];

export interface SubscriptionData {
  planId: LegacyStoredPlanId;
  orderId?: string;
  provider?: "toss_payments";
  paymentKey?: string;
  amount?: number;
  currency?: "KRW" | "USD";
  country?: "KR" | "US";
  paidAt?: string;
  updatedAt: string;
}

interface SubscriptionState {
  currentPlan: PlanType;
  orderId: string | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  fetchSubscription: (userId: string) => Promise<void>;
  applyConfirmedSubscription: (subscription: SubscriptionData) => void;
  canAccessUnlimitedVoca: () => boolean;
  canAccessFeature: (featureId: string) => boolean;
  isAdmin: () => boolean;
  resetSubscription: () => void;
}

const normalizePlanId = (planId: unknown): PlanType => {
  if (planId === "voca_unlimited" || planId === "voca_speaking") {
    return "voca_unlimited";
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

  applyConfirmedSubscription: (subscription: SubscriptionData) => {
    set({
      currentPlan: normalizePlanId(subscription.planId),
      orderId: subscription.orderId ?? null,
      loading: false,
      error: null,
    });
  },

  canAccessUnlimitedVoca: () => {
    const { currentPlan, role } = get();
    // Admins have free premium access
    if (role.includes("admin")) return true;
    return currentPlan !== "free";
  },

  canAccessFeature: () => {
    const { currentPlan, role } = get();
    // Admins have free premium access
    if (role.includes("admin")) return true;
    if (currentPlan !== "free") return true;
    return false;
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
    }),
}));
