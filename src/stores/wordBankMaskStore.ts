import { create } from "zustand";

interface WordBankMaskState {
  maskByCourse: Record<string, boolean>;
  isMaskEnabled: (courseId: string) => boolean;
  setMaskEnabled: (courseId: string, value: boolean) => void;
  toggleMask: (courseId: string) => void;
}

export const useWordBankMaskStore = create<WordBankMaskState>((set) => ({
  maskByCourse: {},
  isMaskEnabled: (courseId) =>
    Boolean(useWordBankMaskStore.getState().maskByCourse[courseId]),
  setMaskEnabled: (courseId, value) =>
    set((state) => ({
      maskByCourse: {
        ...state.maskByCourse,
        [courseId]: value,
      },
    })),
  toggleMask: (courseId) =>
    set((state) => ({
      maskByCourse: {
        ...state.maskByCourse,
        [courseId]: !state.maskByCourse[courseId],
      },
    })),
}));

export const __resetWordBankMaskStoreForTests = () => {
  useWordBankMaskStore.setState({ maskByCourse: {} });
};
