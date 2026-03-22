import { create } from "zustand";

interface NetworkStoreState {
  firebaseOffline: boolean;
  setFirebaseOffline: (value: boolean) => void;
}

export const useNetworkStore = create<NetworkStoreState>((set) => ({
  firebaseOffline: false,
  setFirebaseOffline: (value) => set({ firebaseOffline: value }),
}));
