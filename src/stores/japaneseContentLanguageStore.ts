import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type JapaneseContentLanguageMode = "default" | "ko";

export const JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY =
  "@japaneseContentLanguage:v1";

export interface JapaneseContentLanguageSnapshot {
  mode: JapaneseContentLanguageMode;
}

interface JapaneseContentLanguageState extends JapaneseContentLanguageSnapshot {
  _initialized: boolean;
  setMode: (
    mode: JapaneseContentLanguageMode,
  ) => Promise<JapaneseContentLanguageSnapshot>;
  hydrate: () => Promise<JapaneseContentLanguageSnapshot>;
}

export const DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT: JapaneseContentLanguageSnapshot =
  {
    mode: "default",
  };

const normalizeJapaneseContentLanguageMode = (
  value: unknown,
): JapaneseContentLanguageMode =>
  value === "ko" ? "ko" : DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT.mode;

const normalizeStoredSnapshot = (
  value: unknown,
): JapaneseContentLanguageSnapshot => {
  if (!value || typeof value !== "object") {
    return DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT;
  }

  return {
    mode: normalizeJapaneseContentLanguageMode(
      (value as Partial<JapaneseContentLanguageSnapshot>).mode,
    ),
  };
};

const readStoredSnapshot =
  async (): Promise<JapaneseContentLanguageSnapshot> => {
    const rawSettings = await AsyncStorage.getItem(
      JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY,
    );

    if (!rawSettings) {
      return DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT;
    }

    try {
      return normalizeStoredSnapshot(JSON.parse(rawSettings));
    } catch (error) {
      console.warn("Failed to parse Japanese content language settings", error);
      return DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT;
    }
  };

const persistSnapshot = async (snapshot: JapaneseContentLanguageSnapshot) => {
  await AsyncStorage.setItem(
    JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
};

export const useJapaneseContentLanguageStore =
  create<JapaneseContentLanguageState>((set) => ({
    ...DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT,
    _initialized: false,

    hydrate: async () => {
      const snapshot = await readStoredSnapshot();
      set({ ...snapshot, _initialized: true });
      await persistSnapshot(snapshot);
      return snapshot;
    },

    setMode: async (mode) => {
      const snapshot = {
        mode: normalizeJapaneseContentLanguageMode(mode),
      };

      set({ ...snapshot, _initialized: true });
      await persistSnapshot(snapshot);
      return snapshot;
    },
  }));

export const __resetJapaneseContentLanguageStoreForTests = () => {
  useJapaneseContentLanguageStore.setState({
    ...DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT,
    _initialized: false,
  });
};
