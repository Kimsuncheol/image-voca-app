import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "@word_bank_display_settings";

export type CollocationDisplay = "meaning_only" | "all";
export type OtherDisplay = "word_meaning_only" | "all";

interface WordBankDisplayState {
  collocationDisplay: CollocationDisplay;
  otherDisplay: OtherDisplay;
  _initialized: boolean;
  loadSettings: () => Promise<void>;
  setCollocationDisplay: (value: CollocationDisplay) => void;
  setOtherDisplay: (value: OtherDisplay) => void;
}

export const useWordBankDisplayStore = create<WordBankDisplayState>((set, get) => ({
  collocationDisplay: "all",
  otherDisplay: "all",
  _initialized: false,

  loadSettings: async () => {
    if (get()._initialized) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          collocationDisplay: parsed.collocationDisplay ?? "all",
          otherDisplay: parsed.otherDisplay ?? "all",
        });
      }
    } catch (error) {
      console.error("Failed to load word bank display settings", error);
    } finally {
      set({ _initialized: true });
    }
  },

  setCollocationDisplay: (value: CollocationDisplay) => {
    set({ collocationDisplay: value });
    const { otherDisplay } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ collocationDisplay: value, otherDisplay }),
    ).catch((e) => console.error("Failed to save collocationDisplay", e));
  },

  setOtherDisplay: (value: OtherDisplay) => {
    set({ otherDisplay: value });
    const { collocationDisplay } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ collocationDisplay, otherDisplay: value }),
    ).catch((e) => console.error("Failed to save otherDisplay", e));
  },
}));
