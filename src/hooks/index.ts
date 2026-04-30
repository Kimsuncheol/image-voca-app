/**
 * Hooks Index
 *
 * Central export point for all custom hooks
 */

export { useSpeech, type UseSpeechReturn } from "./useSpeech";
export {
  useSoundMode,
  type UseSoundModeReturn,
  type SoundMode,
  type VolumeLevel,
} from "./useSoundMode";
export { useAndroidImmersiveStudyMode } from "./useAndroidImmersiveStudyMode";
export {
  StudyModeProvider,
  getStudyLanguageTypeFromSpeechLanguage,
  useStudyMode,
  useStudySpeech,
  type StudyLanguageType,
  type StudyModeReturn,
} from "./useStudyMode";
