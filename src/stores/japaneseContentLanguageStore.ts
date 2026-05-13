import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type JapaneseContentLanguageMode = "default" | "ko";

export const JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY =
  "@japaneseContentLanguage:v1";
export const JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD =
  "japaneseContentLanguageMode";

export interface JapaneseContentLanguageSnapshot {
  mode: JapaneseContentLanguageMode;
}

interface JapaneseContentLanguageState extends JapaneseContentLanguageSnapshot {
  _initialized: boolean;
  _hydratedUserId: string | null;
  setMode: (
    mode: JapaneseContentLanguageMode,
    userId?: string | null,
  ) => Promise<JapaneseContentLanguageSnapshot>;
  hydrate: (userId?: string | null) => Promise<JapaneseContentLanguageSnapshot>;
}

export const DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT: JapaneseContentLanguageSnapshot =
  {
    mode: "default",
  };

const normalizeJapaneseContentLanguageMode = (
  value: unknown,
): JapaneseContentLanguageMode =>
  value === "ko" ? "ko" : DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT.mode;

const parseJapaneseContentLanguageMode = (
  value: unknown,
): JapaneseContentLanguageMode | null =>
  value === "default" || value === "ko" ? value : null;

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

const readRemoteSnapshot = async (
  userId: string,
): Promise<JapaneseContentLanguageSnapshot | null> => {
  const { doc, getDoc } =
    require("firebase/firestore") as typeof import("firebase/firestore");
  const { db } =
    require("../services/firebase") as typeof import("../services/firebase");
  const userSnapshot = await getDoc(doc(db, "users", userId));
  if (!userSnapshot.exists()) {
    return null;
  }

  const mode = parseJapaneseContentLanguageMode(
    userSnapshot.data()?.[JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD],
  );

  return mode ? { mode } : null;
};

const persistRemoteSnapshot = async (
  userId: string,
  snapshot: JapaneseContentLanguageSnapshot,
) => {
  const { doc, setDoc } =
    require("firebase/firestore") as typeof import("firebase/firestore");
  const { db } =
    require("../services/firebase") as typeof import("../services/firebase");
  await setDoc(
    doc(db, "users", userId),
    { [JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD]: snapshot.mode },
    { merge: true },
  );
};

export const useJapaneseContentLanguageStore =
  create<JapaneseContentLanguageState>((set) => ({
    ...DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT,
    _initialized: false,
    _hydratedUserId: null,

    hydrate: async (userId) => {
      const localSnapshot = await readStoredSnapshot();
      const remoteSnapshot = userId ? await readRemoteSnapshot(userId) : null;
      const snapshot = remoteSnapshot ?? localSnapshot;

      set({ ...snapshot, _initialized: true, _hydratedUserId: userId ?? null });
      await persistSnapshot(snapshot);
      return snapshot;
    },

    setMode: async (mode, userId) => {
      const snapshot = {
        mode: normalizeJapaneseContentLanguageMode(mode),
      };

      set({ ...snapshot, _initialized: true, _hydratedUserId: userId ?? null });
      await persistSnapshot(snapshot);
      if (userId) {
        await persistRemoteSnapshot(userId, snapshot);
      }
      return snapshot;
    },
  }));

export const __resetJapaneseContentLanguageStoreForTests = () => {
  useJapaneseContentLanguageStore.setState({
    ...DEFAULT_JAPANESE_CONTENT_LANGUAGE_SNAPSHOT,
    _initialized: false,
    _hydratedUserId: null,
  });
};
