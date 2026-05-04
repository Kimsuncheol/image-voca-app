import AsyncStorage from "@react-native-async-storage/async-storage";

export type SpeechPreferenceLanguage = "en" | "ja";
export type SpeechSpeedPreset = "slow" | "normal" | "fast";
export type ReviewMaskTarget =
  | "word-pronunciation"
  | "meaning"
  | "synonym"
  | "all";

export interface SpeechSpeedPreferences {
  en: SpeechSpeedPreset;
  ja: SpeechSpeedPreset;
}

export interface SpeechSpeedPreferenceMutationResult {
  preferences: SpeechSpeedPreferences;
  persistedLocally: boolean;
}

export interface VocabularySpeechPreferences {
  autoSpeakVocabulary: boolean;
  reviewMaskTarget: ReviewMaskTarget;
}

export interface VocabularySpeechPreferenceMutationResult {
  preferences: VocabularySpeechPreferences;
  persistedLocally: boolean;
}

export const SPEECH_SPEED_PREFERENCES_STORAGE_KEY =
  "@speech_speed_preferences";
export const VOCABULARY_SPEECH_PREFERENCES_STORAGE_KEY =
  "@vocabulary_speech_preferences";

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
    fast: 1.1,
  },
};

export const DEFAULT_SPEECH_SPEED_PREFERENCES: SpeechSpeedPreferences = {
  en: "normal",
  ja: "normal",
};

export const DEFAULT_VOCABULARY_SPEECH_PREFERENCES: VocabularySpeechPreferences = {
  autoSpeakVocabulary: true,
  reviewMaskTarget: "word-pronunciation",
};

const speechPreferenceListeners = new Set<
  (preferences: SpeechSpeedPreferences) => void
>();
const vocabularySpeechPreferenceListeners = new Set<
  (preferences: VocabularySpeechPreferences) => void
>();
let cachedSpeechSpeedPreferences: SpeechSpeedPreferences | null = null;
let cachedVocabularySpeechPreferences: VocabularySpeechPreferences | null = null;

const isSpeechSpeedPreset = (value: unknown): value is SpeechSpeedPreset =>
  value === "slow" || value === "normal" || value === "fast";

export const isReviewMaskTarget = (
  value: unknown,
): value is ReviewMaskTarget =>
  value === "word-pronunciation" ||
  value === "meaning" ||
  value === "synonym" ||
  value === "all";

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

export const normalizeVocabularySpeechPreferences = (
  value: unknown,
): VocabularySpeechPreferences => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_VOCABULARY_SPEECH_PREFERENCES };
  }

  const preferences = value as Partial<
    Record<keyof VocabularySpeechPreferences, unknown>
  >;

  return {
    autoSpeakVocabulary:
      typeof preferences.autoSpeakVocabulary === "boolean"
        ? preferences.autoSpeakVocabulary
        : DEFAULT_VOCABULARY_SPEECH_PREFERENCES.autoSpeakVocabulary,
    reviewMaskTarget: isReviewMaskTarget(preferences.reviewMaskTarget)
      ? preferences.reviewMaskTarget
      : DEFAULT_VOCABULARY_SPEECH_PREFERENCES.reviewMaskTarget,
  };
};

const notifySpeechPreferenceListeners = (preferences: SpeechSpeedPreferences) => {
  speechPreferenceListeners.forEach((listener) => listener(preferences));
};

const notifyVocabularySpeechPreferenceListeners = (
  preferences: VocabularySpeechPreferences,
) => {
  vocabularySpeechPreferenceListeners.forEach((listener) =>
    listener(preferences),
  );
};

const applySpeechSpeedPreferences = (preferences: SpeechSpeedPreferences) => {
  cachedSpeechSpeedPreferences = preferences;
  notifySpeechPreferenceListeners(preferences);
};

const applyVocabularySpeechPreferences = (
  preferences: VocabularySpeechPreferences,
) => {
  cachedVocabularySpeechPreferences = preferences;
  notifyVocabularySpeechPreferenceListeners(preferences);
};

const persistSpeechSpeedPreferences = async (
  preferences: SpeechSpeedPreferences,
) => {
  try {
    await AsyncStorage.setItem(
      SPEECH_SPEED_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
    return true;
  } catch (error) {
    console.warn("Failed to persist speech speed preferences", error);
    return false;
  }
};

const persistVocabularySpeechPreferences = async (
  preferences: VocabularySpeechPreferences,
) => {
  try {
    await AsyncStorage.setItem(
      VOCABULARY_SPEECH_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
    return true;
  } catch (error) {
    console.warn("Failed to persist vocabulary speech preferences", error);
    return false;
  }
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

const writeVocabularySpeechPreferencesForUser = async (
  userId: string,
  preferences: VocabularySpeechPreferences,
) => {
  const { doc, serverTimestamp, setDoc } = require("firebase/firestore") as typeof import(
    "firebase/firestore"
  );
  const { db } = require("./firebase") as typeof import("./firebase");

  await setDoc(
    doc(db, "users", userId, "vocabulary_speech", "preferences"),
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
      const normalizedPreferencesObject =
        normalizeSpeechSpeedPreferences(parsedPreferences);
      cachedSpeechSpeedPreferences = normalizedPreferencesObject;
      const normalizedPreferences = JSON.stringify(normalizedPreferencesObject);
      if (rawPreferences && rawPreferences !== normalizedPreferences) {
        await persistSpeechSpeedPreferences(normalizedPreferencesObject);
      }
    } catch (error) {
      console.warn("Failed to load speech speed preferences", error);
      cachedSpeechSpeedPreferences = { ...DEFAULT_SPEECH_SPEED_PREFERENCES };
    }

    return cachedSpeechSpeedPreferences;
  };

export const getVocabularySpeechPreferences =
  async (): Promise<VocabularySpeechPreferences> => {
    if (cachedVocabularySpeechPreferences) {
      return cachedVocabularySpeechPreferences;
    }

    try {
      const rawPreferences = await AsyncStorage.getItem(
        VOCABULARY_SPEECH_PREFERENCES_STORAGE_KEY,
      );
      const parsedPreferences = rawPreferences
        ? JSON.parse(rawPreferences)
        : undefined;
      const normalizedPreferencesObject =
        normalizeVocabularySpeechPreferences(parsedPreferences);
      cachedVocabularySpeechPreferences = normalizedPreferencesObject;
      const normalizedPreferences = JSON.stringify(normalizedPreferencesObject);
      if (rawPreferences && rawPreferences !== normalizedPreferences) {
        await persistVocabularySpeechPreferences(normalizedPreferencesObject);
      }
    } catch (error) {
      console.warn("Failed to load vocabulary speech preferences", error);
      cachedVocabularySpeechPreferences = {
        ...DEFAULT_VOCABULARY_SPEECH_PREFERENCES,
      };
    }

    return cachedVocabularySpeechPreferences;
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
): Promise<SpeechSpeedPreferenceMutationResult> => {
  const preferences = await getSpeechSpeedPreferences();
  const nextPreferences = {
    ...preferences,
    [language]: resolveSpeechSpeedPreset(language, preset),
  };
  applySpeechSpeedPreferences(nextPreferences);
  const persistedLocally = await persistSpeechSpeedPreferences(nextPreferences);
  return {
    preferences: nextPreferences,
    persistedLocally,
  };
};

export const setAutoSpeakVocabularyPreference = async (
  enabled: boolean,
): Promise<VocabularySpeechPreferenceMutationResult> => {
  const preferences = await getVocabularySpeechPreferences();
  const nextPreferences = {
    ...preferences,
    autoSpeakVocabulary: enabled,
  };
  applyVocabularySpeechPreferences(nextPreferences);
  const persistedLocally =
    await persistVocabularySpeechPreferences(nextPreferences);
  return {
    preferences: nextPreferences,
    persistedLocally,
  };
};

export const setReviewMaskTargetPreference = async (
  target: ReviewMaskTarget,
): Promise<VocabularySpeechPreferenceMutationResult> => {
  const preferences = await getVocabularySpeechPreferences();
  const nextPreferences = {
    ...preferences,
    reviewMaskTarget: isReviewMaskTarget(target)
      ? target
      : DEFAULT_VOCABULARY_SPEECH_PREFERENCES.reviewMaskTarget,
  };
  applyVocabularySpeechPreferences(nextPreferences);
  const persistedLocally =
    await persistVocabularySpeechPreferences(nextPreferences);
  return {
    preferences: nextPreferences,
    persistedLocally,
  };
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
    applySpeechSpeedPreferences(remotePreferences);
    await persistSpeechSpeedPreferences(remotePreferences);
    return remotePreferences;
  } catch (error) {
    console.warn("Failed to hydrate remote speech speed preferences", error);
    return localPreferences;
  }
};

export const hydrateVocabularySpeechPreferencesForUser = async (
  userId: string,
) => {
  const localPreferences = await getVocabularySpeechPreferences();

  try {
    const { doc, getDoc } = require("firebase/firestore") as typeof import(
      "firebase/firestore"
    );
    const { db } = require("./firebase") as typeof import("./firebase");
    const preferencesRef = doc(
      db,
      "users",
      userId,
      "vocabulary_speech",
      "preferences",
    );
    const snapshot = await getDoc(preferencesRef);

    if (!snapshot.exists()) {
      await writeVocabularySpeechPreferencesForUser(userId, localPreferences);
      return localPreferences;
    }

    const remotePreferences = normalizeVocabularySpeechPreferences(
      snapshot.data(),
    );
    applyVocabularySpeechPreferences(remotePreferences);
    await persistVocabularySpeechPreferences(remotePreferences);
    return remotePreferences;
  } catch (error) {
    console.warn("Failed to hydrate remote vocabulary speech preferences", error);
    return localPreferences;
  }
};

export const setSpeechSpeedPreferenceForUser = async (
  userId: string,
  language: SpeechPreferenceLanguage,
  preset: SpeechSpeedPreset,
): Promise<SpeechSpeedPreferenceMutationResult> => {
  const result = await setSpeechSpeedPreference(language, preset);

  try {
    await writeSpeechSpeedPreferencesForUser(userId, result.preferences);
  } catch (error) {
    console.warn("Failed to sync speech speed preferences", error);
  }

  return result;
};

export const setAutoSpeakVocabularyPreferenceForUser = async (
  userId: string,
  enabled: boolean,
): Promise<VocabularySpeechPreferenceMutationResult> => {
  const result = await setAutoSpeakVocabularyPreference(enabled);

  try {
    await writeVocabularySpeechPreferencesForUser(userId, result.preferences);
  } catch (error) {
    console.warn("Failed to sync vocabulary speech preferences", error);
  }

  return result;
};

export const setReviewMaskTargetPreferenceForUser = async (
  userId: string,
  target: ReviewMaskTarget,
): Promise<VocabularySpeechPreferenceMutationResult> => {
  const result = await setReviewMaskTargetPreference(target);

  try {
    await writeVocabularySpeechPreferencesForUser(userId, result.preferences);
  } catch (error) {
    console.warn("Failed to sync vocabulary speech preferences", error);
  }

  return result;
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

export const subscribeToVocabularySpeechPreferences = (
  listener: (preferences: VocabularySpeechPreferences) => void,
) => {
  vocabularySpeechPreferenceListeners.add(listener);
  if (cachedVocabularySpeechPreferences) {
    listener(cachedVocabularySpeechPreferences);
  }

  return () => {
    vocabularySpeechPreferenceListeners.delete(listener);
  };
};

export const __resetSpeechPreferencesForTests = () => {
  cachedSpeechSpeedPreferences = null;
  cachedVocabularySpeechPreferences = null;
  speechPreferenceListeners.clear();
  vocabularySpeechPreferenceListeners.clear();
};
