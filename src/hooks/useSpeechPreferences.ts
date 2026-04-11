import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  DEFAULT_SPEECH_SPEED_PREFERENCES,
  SpeechPreferenceLanguage,
  SpeechSpeedPreferenceMutationResult,
  SpeechSpeedPreset,
  SpeechSpeedPreferences,
  getDefaultSpeechSpeedPreset,
  getSpeechRateForPreset,
  getSpeechSpeedPreferences,
  hydrateSpeechSpeedPreferencesForUser,
  setSpeechSpeedPreference,
  setSpeechSpeedPreferenceForUser,
  subscribeToSpeechSpeedPreferences,
} from "../services/speechPreferences";

export interface UseSpeechPreferencesReturn {
  preferences: SpeechSpeedPreferences;
  isLoading: boolean;
  setPreset: (
    language: SpeechPreferenceLanguage,
    preset: SpeechSpeedPreset,
  ) => Promise<SpeechSpeedPreferenceMutationResult>;
  getPreset: (language: SpeechPreferenceLanguage) => SpeechSpeedPreset;
  getRate: (language: SpeechPreferenceLanguage) => number;
}

export const useSpeechPreferences = (): UseSpeechPreferencesReturn => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SpeechSpeedPreferences>(
    DEFAULT_SPEECH_SPEED_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    const unsubscribe = subscribeToSpeechSpeedPreferences((nextPreferences) => {
      if (isActive) {
        setPreferences(nextPreferences);
      }
    });

    const hydratePreferences = async () => {
      try {
        const localPreferences = await getSpeechSpeedPreferences();
        if (isActive) {
          setPreferences(localPreferences);
        }

        if (user?.uid) {
          const remotePreferences = await hydrateSpeechSpeedPreferencesForUser(
            user.uid,
          );
          if (isActive) {
            setPreferences(remotePreferences);
          }
        }
      } catch (error) {
        console.warn("Failed to hydrate speech preferences", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void hydratePreferences();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user?.uid]);

  const setPreset = useCallback(
    async (language: SpeechPreferenceLanguage, preset: SpeechSpeedPreset) => {
      if (user?.uid) {
        return setSpeechSpeedPreferenceForUser(user.uid, language, preset);
      }

      return setSpeechSpeedPreference(language, preset);
    },
    [user?.uid],
  );

  const getPreset = useCallback(
    (language: SpeechPreferenceLanguage) =>
      preferences[language] ?? getDefaultSpeechSpeedPreset(language),
    [preferences],
  );

  const getRate = useCallback(
    (language: SpeechPreferenceLanguage) =>
      getSpeechRateForPreset(language, getPreset(language)),
    [getPreset],
  );

  return useMemo(
    () => ({
      preferences,
      isLoading,
      setPreset,
      getPreset,
      getRate,
    }),
    [getPreset, getRate, isLoading, preferences, setPreset],
  );
};
