import { create } from "zustand";

interface NetworkStoreState {
  firebaseOffline: boolean;
  firebaseReconnected: boolean;
  setFirebaseOffline: (value: boolean) => void;
  setFirebaseOnline: () => void;
  clearFirebaseReconnected: () => void;
}

export const useNetworkStore = create<NetworkStoreState>((set, get) => ({
  firebaseOffline: false,
  firebaseReconnected: false,
  setFirebaseOffline: (value) => set({ firebaseOffline: value }),
  setFirebaseOnline: () => {
    const wasOffline = get().firebaseOffline;
    set({ firebaseOffline: false, firebaseReconnected: wasOffline });
  },
  clearFirebaseReconnected: () => set({ firebaseReconnected: false }),
}));
