import { create } from "zustand";

export type TutorialStatus = "idle" | "loading" | "required" | "completed";

interface TutorialStoreState {
  tutorialStatus: TutorialStatus;
  setTutorialStatus: (status: TutorialStatus) => void;
  resetTutorialStatus: () => void;
}

export const useTutorialStore = create<TutorialStoreState>((set) => ({
  tutorialStatus: "idle",
  setTutorialStatus: (status) => set({ tutorialStatus: status }),
  resetTutorialStatus: () => set({ tutorialStatus: "idle" }),
}));
