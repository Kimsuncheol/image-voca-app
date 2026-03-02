import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "@dashboard_settings";

export type DashboardElement = "quiz" | "famousQuote" | "stats";

const DEFAULT_ORDER: DashboardElement[] = ["quiz", "famousQuote", "stats"];

interface DashboardSettingsState {
  quizEnabled: boolean;
  famousQuoteEnabled: boolean;
  elementOrder: DashboardElement[];
  _initialized: boolean;
  loadSettings: () => Promise<void>;
  setQuizEnabled: (value: boolean) => void;
  setFamousQuoteEnabled: (value: boolean) => void;
  setElementOrder: (order: DashboardElement[]) => void;
}

export const useDashboardSettingsStore = create<DashboardSettingsState>((set, get) => ({
  quizEnabled: true,
  famousQuoteEnabled: true,
  elementOrder: DEFAULT_ORDER,
  _initialized: false,

  loadSettings: async () => {
    if (get()._initialized) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          quizEnabled: parsed.quizEnabled ?? true,
          famousQuoteEnabled: parsed.famousQuoteEnabled ?? true,
          elementOrder: parsed.elementOrder ?? DEFAULT_ORDER,
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard settings", error);
    } finally {
      set({ _initialized: true });
    }
  },

  setQuizEnabled: (value: boolean) => {
    set({ quizEnabled: value });
    const { famousQuoteEnabled, elementOrder } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ quizEnabled: value, famousQuoteEnabled, elementOrder }),
    ).catch((e) => console.error("Failed to save quizEnabled", e));
  },

  setFamousQuoteEnabled: (value: boolean) => {
    set({ famousQuoteEnabled: value });
    const { quizEnabled, elementOrder } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ quizEnabled, famousQuoteEnabled: value, elementOrder }),
    ).catch((e) => console.error("Failed to save famousQuoteEnabled", e));
  },

  setElementOrder: (order: DashboardElement[]) => {
    set({ elementOrder: order });
    const { quizEnabled, famousQuoteEnabled } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ quizEnabled, famousQuoteEnabled, elementOrder: order }),
    ).catch((e) => console.error("Failed to save elementOrder", e));
  },
}));
