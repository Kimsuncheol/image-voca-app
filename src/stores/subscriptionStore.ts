import { doc, getDoc, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";
import type { UserRole } from "../types/userRole";
import { normalizeUserRole } from "../utils/role";

interface UserRoleState {
  role: UserRole;
  loading: boolean;
  error: string | null;
  fetchSubscription: (userId: string) => Promise<void>;
  isAdmin: () => boolean;
  resetSubscription: () => void;
}

export const useSubscriptionStore = create<UserRoleState>((set, get) => ({
  role: "student",
  loading: false,
  error: null,

  fetchSubscription: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role: UserRole = normalizeUserRole(data.role);
        console.log(
          "📋 Current User Role:",
          role,
          "| Raw role from Firestore:",
          data.role,
        );
        set({ role, loading: false });
      } else {
        await setDoc(userRef, {}, { merge: true });
        set({ role: "student", loading: false });
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to load user data.",
        loading: false,
      });
      console.log(error.message);
    }
  },

  isAdmin: () => {
    const { role } = get();
    return role.includes("admin");
  },

  resetSubscription: () =>
    set({
      role: "student",
      loading: false,
      error: null,
    }),
}));
