import { create } from "zustand";

interface WordBankMaskState {
  isMaskEnabled: boolean;
  setMaskEnabled: (value: boolean) => void;
  toggleMask: () => void;
}

export const useWordBankMaskStore = create<WordBankMaskState>((set) => ({
  isMaskEnabled: false,
  setMaskEnabled: (value) => set({ isMaskEnabled: value }),
  toggleMask: () =>
    set((state) => ({ isMaskEnabled: !state.isMaskEnabled })),
}));

export const __resetWordBankMaskStoreForTests = () => {
  useWordBankMaskStore.setState({ isMaskEnabled: false });
};
