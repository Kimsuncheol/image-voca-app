import AsyncStorage from "@react-native-async-storage/async-storage";

export type SpeechPreferenceLanguage = "en" | "ja";
export type SpeechSpeedPreset = "slow" | "normal" | "fast";

export interface SpeechSpeedPreferences {
  en: SpeechSpeedPreset;
  ja: SpeechSpeedPreset;
}

export const SPEECH_SPEED_PREFERENCES_STORAGE_KEY =
  "@speech_speed_preferences";

export const SPEECH_SPEED_PRESET_ORDER: SpeechSpeedPreset[] = [
  "slow",
  "normal",
  "fast",
];

export const SPEECH_SPEED_PRESET_RATES: Record<
  SpeechPreferenceLanguage,
  Record<SpeechSpeedPreset, number>
> = {
  en: {
    slow: 0.75,
    normal: 0.9,
    fast: 1.1,
  },
  ja: {
    slow: 0.7,
    normal: 0.85,
    fast: 1.05,
  },
};

export const DEFAULT_SPEECH_SPEED_PREFERENCES: SpeechSpeedPreferences = {
  en: "normal",
  ja: "normal",
};

const speechPreferenceListeners = new Set<
  (preferences: SpeechSpeedPreferences) => void
>();
let cachedSpeechSpeedPreferences: SpeechSpeedPreferences | null = null;

const isSpeechSpeedPreset = (value: unknown): value is SpeechSpeedPreset =>
  value === "slow" || value === "normal" || value === "fast";

export const getDefaultSpeechSpeedPreset = (
  _language: SpeechPreferenceLanguage,
): SpeechSpeedPreset => "normal";

export const getSpeechRateForPreset = (
  language: SpeechPreferenceLanguage,
  preset: SpeechSpeedPreset,
) => SPEECH_SPEED_PRESET_RATES[language][preset];

export const getNextSpeechSpeedPreset = (
  currentPreset: SpeechSpeedPreset,
): SpeechSpeedPreset => {
  const currentIndex = SPEECH_SPEED_PRESET_ORDER.indexOf(currentPreset);
  const nextIndex = (currentIndex + 1) % SPEECH_SPEED_PRESET_ORDER.length;

  return SPEECH_SPEED_PRESET_ORDER[nextIndex];
};

export const resolveSpeechSpeedPreset = (
  language: SpeechPreferenceLanguage,
  value: unknown,
): SpeechSpeedPreset => {
  if (isSpeechSpeedPreset(value)) {
    return value;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return getDefaultSpeechSpeedPreset(language);
  }

  return SPEECH_SPEED_PRESET_ORDER.reduce<SpeechSpeedPreset>(
    (nearestPreset, preset) => {
      const currentDistance = Math.abs(
        value - getSpeechRateForPreset(language, nearestPreset),
      );
      const nextDistance = Math.abs(value - getSpeechRateForPreset(language, preset));

      return nextDistance < currentDistance ? preset : nearestPreset;
    },
    getDefaultSpeechSpeedPreset(language),
  );
};

export const getSpeechPreferenceLanguage = (
  languageCode?: string,
): SpeechPreferenceLanguage | null => {
  const normalizedLanguage = (languageCode || "en-US")
    .trim()
    .replace(/_/g, "-")
    .toLowerCase();
  const baseLanguage = normalizedLanguage.split("-")[0];

  if (baseLanguage === "ja") return "ja";
  if (baseLanguage === "en") return "en";
  return null;
};

const normalizeSpeechSpeedPreferences = (
  value: unknown,
): SpeechSpeedPreferences => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_SPEECH_SPEED_PREFERENCES };
  }

  const preferences = value as Partial<Record<SpeechPreferenceLanguage, unknown>>;
  return {
    en: resolveSpeechSpeedPreset("en", preferences.en),
    ja: resolveSpeechSpeedPreset("ja", preferences.ja),
  };
};

const notifySpeechPreferenceListeners = (preferences: SpeechSpeedPreferences) => {
  speechPreferenceListeners.forEach((listener) => listener(preferences));
};

const persistSpeechSpeedPreferences = async (
  preferences: SpeechSpeedPreferences,
) => {
  cachedSpeechSpeedPreferences = preferences;
  await AsyncStorage.setItem(
    SPEECH_SPEED_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
  notifySpeechPreferenceListeners(preferences);
};

const writeSpeechSpeedPreferencesForUser = async (
  userId: string,
  preferences: SpeechSpeedPreferences,
) => {
  const { doc, serverTimestamp, setDoc } = require("firebase/firestore") as typeof import(
    "firebase/firestore"
  );
  const { db } = require("./firebase") as typeof import("./firebase");

  await setDoc(
    doc(db, "users", userId, "pronunciation_speed", "preferences"),
    {
      ...preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const getSpeechSpeedPreferences =
  async (): Promise<SpeechSpeedPreferences> => {
    if (cachedSpeechSpeedPreferences) {
      return cachedSpeechSpeedPreferences;
    }

    try {
      const rawPreferences = await AsyncStorage.getItem(
        SPEECH_SPEED_PREFERENCES_STORAGE_KEY,
      );
      const parsedPreferences = rawPreferences
        ? JSON.parse(rawPreferences)
        : undefined;
      cachedSpeechSpeedPreferences =
        normalizeSpeechSpeedPreferences(parsedPreferences);
      const normalizedPreferences = JSON.stringify(cachedSpeechSpeedPreferences);
      if (rawPreferences && rawPreferences !== normalizedPreferences) {
        await AsyncStorage.setItem(
          SPEECH_SPEED_PREFERENCES_STORAGE_KEY,
          normalizedPreferences,
        );
      }
    } catch (error) {
      console.warn("Failed to load speech speed preferences", error);
      cachedSpeechSpeedPreferences = { ...DEFAULT_SPEECH_SPEED_PREFERENCES };
    }

    return cachedSpeechSpeedPreferences;
  };

export const getSpeechRatePreference = async (
  language: SpeechPreferenceLanguage,
) => {
  const preferences = await getSpeechSpeedPreferences();
  return getSpeechRateForPreset(language, preferences[language]);
};

export const setSpeechSpeedPreference = async (
  language: SpeechPreferenceLanguage,
  preset: SpeechSpeedPreset,
) => {
  const preferences = await getSpeechSpeedPreferences();
  const nextPreferences = {
    ...preferences,
    [language]: resolveSpeechSpeedPreset(language, preset),
  };
  await persistSpeechSpeedPreferences(nextPreferences);
  return nextPreferences;
};

export const hydrateSpeechSpeedPreferencesForUser = async (userId: string) => {
  const localPreferences = await getSpeechSpeedPreferences();

  try {
    const { doc, getDoc } = require("firebase/firestore") as typeof import(
      "firebase/firestore"
    );
    const { db } = require("./firebase") as typeof import("./firebase");
    const preferencesRef = doc(
      db,
      "users",
      userId,
      "pronunciation_speed",
      "preferences",
    );
    const snapshot = await getDoc(preferencesRef);

    if (!snapshot.exists()) {
      await writeSpeechSpeedPreferencesForUser(userId, localPreferences);
      return localPreferences;
    }

    const remotePreferences = normalizeSpeechSpeedPreferences(snapshot.data());
    await persistSpeechSpeedPreferences(remotePreferences);
    return remotePreferences;
  } catch (error) {
    console.warn("Failed to hydrate remote speech speed preferences", error);
    return localPreferences;
  }
};

export const setSpeechSpeedPreferenceForUser = async (
  userId: string,
  language: SpeechPreferenceLanguage,
  preset: SpeechSpeedPreset,
) => {
  const nextPreferences = await setSpeechSpeedPreference(language, preset);

  try {
    await writeSpeechSpeedPreferencesForUser(userId, nextPreferences);
  } catch (error) {
    console.warn("Failed to sync speech speed preferences", error);
  }

  return nextPreferences;
};

export const subscribeToSpeechSpeedPreferences = (
  listener: (preferences: SpeechSpeedPreferences) => void,
) => {
  speechPreferenceListeners.add(listener);
  if (cachedSpeechSpeedPreferences) {
    listener(cachedSpeechSpeedPreferences);
  }

  return () => {
    speechPreferenceListeners.delete(listener);
  };
};

export const __resetSpeechPreferencesForTests = () => {
  cachedSpeechSpeedPreferences = null;
  speechPreferenceListeners.clear();
};
