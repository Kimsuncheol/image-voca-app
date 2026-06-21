import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  __resetLockScreenStudyPreferencesForTests,
  getLockScreenStudyPreferences,
  LOCK_SCREEN_STUDY_PREFERENCES_STORAGE_KEY,
  normalizeLockScreenStudyPreferences,
  setLockScreenStudyEnabled,
  subscribeLockScreenStudyPreferences,
} from "../src/services/lockScreenStudyPreferences";

describe("lock screen study preferences", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    __resetLockScreenStudyPreferencesForTests();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    __resetLockScreenStudyPreferencesForTests();
  });

  it("defaults lock screen study mode to off", async () => {
    await expect(getLockScreenStudyPreferences()).resolves.toEqual({
      studyOnLockScreenEnabled: false,
    });
  });

  it("normalizes persisted values", () => {
    expect(
      normalizeLockScreenStudyPreferences({
        studyOnLockScreenEnabled: true,
      }),
    ).toEqual({ studyOnLockScreenEnabled: true });
    expect(normalizeLockScreenStudyPreferences({})).toEqual({
      studyOnLockScreenEnabled: false,
    });
  });

  it("persists and notifies preference changes", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeLockScreenStudyPreferences(listener);

    await expect(setLockScreenStudyEnabled(true)).resolves.toEqual({
      preferences: { studyOnLockScreenEnabled: true },
      persistedLocally: true,
    });

    expect(listener).toHaveBeenCalledWith({
      studyOnLockScreenEnabled: true,
    });
    await expect(
      AsyncStorage.getItem(LOCK_SCREEN_STUDY_PREFERENCES_STORAGE_KEY),
    ).resolves.toBe(JSON.stringify({ studyOnLockScreenEnabled: true }));

    unsubscribe();
    await setLockScreenStudyEnabled(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
