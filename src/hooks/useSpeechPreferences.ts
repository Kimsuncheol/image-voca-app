import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  DEFAULT_SPEECH_SPEED_PREFERENCES,
  DEFAULT_VOCABULARY_SPEECH_PREFERENCES,
  ReviewMaskTarget,
  SpeechPreferenceLanguage,
  SpeechSpeedPreferenceMutationResult,
  SpeechSpeedPreset,
  SpeechSpeedPreferences,
  VocabularySpeechPreferenceMutationResult,
  VocabularySpeechPreferences,
  getDefaultSpeechSpeedPreset,
  getSpeechRateForPreset,
  getSpeechSpeedPreferences,
  getVocabularySpeechPreferences,
  hydrateSpeechSpeedPreferencesForUser,
  hydrateVocabularySpeechPreferencesForUser,
  setAutoSpeakVocabularyPreference,
  setAutoSpeakVocabularyPreferenceForUser,
  setReviewMaskTargetPreference,
  setReviewMaskTargetPreferenceForUser,
  setSpeechSpeedPreference,
  setSpeechSpeedPreferenceForUser,
  subscribeToSpeechSpeedPreferences,
  subscribeToVocabularySpeechPreferences,
} from "../services/speechPreferences";

export interface UseSpeechPreferencesReturn {
  preferences: SpeechSpeedPreferences;
  vocabularyPreferences: VocabularySpeechPreferences;
  isLoading: boolean;
  setPreset: (
    language: SpeechPreferenceLanguage,
    preset: SpeechSpeedPreset,
  ) => Promise<SpeechSpeedPreferenceMutationResult>;
  setAutoSpeakVocabulary: (
    enabled: boolean,
  ) => Promise<VocabularySpeechPreferenceMutationResult>;
  setReviewMaskTarget: (
    target: ReviewMaskTarget,
  ) => Promise<VocabularySpeechPreferenceMutationResult>;
  getPreset: (language: SpeechPreferenceLanguage) => SpeechSpeedPreset;
  getRate: (language: SpeechPreferenceLanguage) => number;
}

export const useSpeechPreferences = (): UseSpeechPreferencesReturn => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SpeechSpeedPreferences>(
    DEFAULT_SPEECH_SPEED_PREFERENCES,
  );
  const [vocabularyPreferences, setVocabularyPreferences] =
    useState<VocabularySpeechPreferences>(
      DEFAULT_VOCABULARY_SPEECH_PREFERENCES,
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
    const unsubscribeVocabulary = subscribeToVocabularySpeechPreferences(
      (nextPreferences) => {
        if (isActive) {
          setVocabularyPreferences(nextPreferences);
        }
      },
    );

    const hydratePreferences = async () => {
      try {
        const [localPreferences, localVocabularyPreferences] =
          await Promise.all([
            getSpeechSpeedPreferences(),
            getVocabularySpeechPreferences(),
          ]);
        if (isActive) {
          setPreferences(localPreferences);
          setVocabularyPreferences(localVocabularyPreferences);
        }

        if (user?.uid) {
          const [remotePreferences, remoteVocabularyPreferences] =
            await Promise.all([
              hydrateSpeechSpeedPreferencesForUser(user.uid),
              hydrateVocabularySpeechPreferencesForUser(user.uid),
            ]);
          if (isActive) {
            setPreferences(remotePreferences);
            setVocabularyPreferences(remoteVocabularyPreferences);
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
      unsubscribeVocabulary();
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

  const setAutoSpeakVocabulary = useCallback(
    async (enabled: boolean) => {
      if (user?.uid) {
        return setAutoSpeakVocabularyPreferenceForUser(user.uid, enabled);
      }

      return setAutoSpeakVocabularyPreference(enabled);
    },
    [user?.uid],
  );

  const setReviewMaskTarget = useCallback(
    async (target: ReviewMaskTarget) => {
      if (user?.uid) {
        return setReviewMaskTargetPreferenceForUser(user.uid, target);
      }

      return setReviewMaskTargetPreference(target);
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
      vocabularyPreferences,
      isLoading,
      setPreset,
      setAutoSpeakVocabulary,
      setReviewMaskTarget,
      getPreset,
      getRate,
    }),
    [
      getPreset,
      getRate,
      isLoading,
      preferences,
      setAutoSpeakVocabulary,
      setPreset,
      setReviewMaskTarget,
      vocabularyPreferences,
    ],
  );
};
