import AsyncStorage from "@react-native-async-storage/async-storage";

export const LOCK_SCREEN_STUDY_PREFERENCES_STORAGE_KEY =
  "@lock_screen_study_preferences";

export interface LockScreenStudyPreferences {
  studyOnLockScreenEnabled: boolean;
}

export interface LockScreenStudyPreferenceMutationResult {
  preferences: LockScreenStudyPreferences;
  persistedLocally: boolean;
}

export const DEFAULT_LOCK_SCREEN_STUDY_PREFERENCES: LockScreenStudyPreferences = {
  studyOnLockScreenEnabled: false,
};

const listeners = new Set<(preferences: LockScreenStudyPreferences) => void>();
let cachedPreferences: LockScreenStudyPreferences | null = null;

export const normalizeLockScreenStudyPreferences = (
  value: unknown,
): LockScreenStudyPreferences => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_LOCK_SCREEN_STUDY_PREFERENCES };
  }

  const preferences = value as Partial<
    Record<keyof LockScreenStudyPreferences, unknown>
  >;

  return {
    studyOnLockScreenEnabled:
      typeof preferences.studyOnLockScreenEnabled === "boolean"
        ? preferences.studyOnLockScreenEnabled
        : DEFAULT_LOCK_SCREEN_STUDY_PREFERENCES.studyOnLockScreenEnabled,
  };
};

const notifyListeners = (preferences: LockScreenStudyPreferences) => {
  listeners.forEach((listener) => listener(preferences));
};

const applyPreferences = (preferences: LockScreenStudyPreferences) => {
  cachedPreferences = preferences;
  notifyListeners(preferences);
};

export const getLockScreenStudyPreferences =
  async (): Promise<LockScreenStudyPreferences> => {
    if (cachedPreferences) {
      return cachedPreferences;
    }

    try {
      const raw = await AsyncStorage.getItem(
        LOCK_SCREEN_STUDY_PREFERENCES_STORAGE_KEY,
      );
      const preferences = normalizeLockScreenStudyPreferences(
        raw ? JSON.parse(raw) : null,
      );
      cachedPreferences = preferences;
      return preferences;
    } catch (error) {
      console.warn("Failed to load lock screen study preferences", error);
      return { ...DEFAULT_LOCK_SCREEN_STUDY_PREFERENCES };
    }
  };

export const setLockScreenStudyEnabled = async (
  studyOnLockScreenEnabled: boolean,
): Promise<LockScreenStudyPreferenceMutationResult> => {
  const preferences = { studyOnLockScreenEnabled };
  let persistedLocally = false;

  try {
    await AsyncStorage.setItem(
      LOCK_SCREEN_STUDY_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
    persistedLocally = true;
  } catch (error) {
    console.warn("Failed to save lock screen study preferences", error);
  }

  applyPreferences(preferences);
  return { preferences, persistedLocally };
};

export const subscribeLockScreenStudyPreferences = (
  listener: (preferences: LockScreenStudyPreferences) => void,
) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const __resetLockScreenStudyPreferencesForTests = () => {
  cachedPreferences = null;
  listeners.clear();
};
