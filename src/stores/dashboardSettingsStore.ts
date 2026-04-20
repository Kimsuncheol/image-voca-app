import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "@dashboard_settings";

export type DashboardElement = "famousQuote";

const DEFAULT_ORDER: DashboardElement[] = ["famousQuote"];

const normalizeElementOrder = (value: unknown): DashboardElement[] => {
  if (!Array.isArray(value)) {
    return DEFAULT_ORDER;
  }

  const filtered = value.filter(
    (item): item is DashboardElement =>
      item === "famousQuote",
  );

  const nextOrder = [...filtered];

  for (const element of DEFAULT_ORDER) {
    if (!nextOrder.includes(element)) {
      nextOrder.push(element);
    }
  }

  return nextOrder;
};

interface DashboardSettingsState {
  famousQuoteEnabled: boolean;
  elementOrder: DashboardElement[];
  _initialized: boolean;
  loadSettings: () => Promise<void>;
  setFamousQuoteEnabled: (value: boolean) => void;
  setElementOrder: (order: DashboardElement[]) => void;
}

export const useDashboardSettingsStore = create<DashboardSettingsState>((set, get) => ({
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
          famousQuoteEnabled: parsed.famousQuoteEnabled ?? true,
          elementOrder: normalizeElementOrder(parsed.elementOrder),
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard settings", error);
    } finally {
      set({ _initialized: true });
    }
  },

  setFamousQuoteEnabled: (value: boolean) => {
    set({ famousQuoteEnabled: value });
    const { elementOrder } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ famousQuoteEnabled: value, elementOrder }),
    ).catch((e) => console.error("Failed to save famousQuoteEnabled", e));
  },

  setElementOrder: (order: DashboardElement[]) => {
    const elementOrder = normalizeElementOrder(order);
    set({ elementOrder });
    const { famousQuoteEnabled } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ famousQuoteEnabled, elementOrder }),
    ).catch((e) => console.error("Failed to save elementOrder", e));
  },
}));
