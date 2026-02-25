import { create } from "zustand";
import type { NotificationCardPayload } from "../types/notificationCard";

interface NotificationCardState {
  pendingNotificationCard: NotificationCardPayload | null;
  setPendingNotificationCard: (payload: NotificationCardPayload) => void;
  clearPendingNotificationCard: () => void;
}

export const useNotificationCardStore = create<NotificationCardState>((set) => ({
  pendingNotificationCard: null,
  setPendingNotificationCard: (payload) => set({ pendingNotificationCard: payload }),
  clearPendingNotificationCard: () => set({ pendingNotificationCard: null }),
}));
