/**
 * Speech Service
 *
 * Centralized Text-to-Speech functionality using expo-speech
 * Provides configuration and utilities for TTS across the app
 */

import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface SpeechOptions {
  /** Language code (e.g., "en-US", "ko-KR") */
  language?: string;
  /** Speech rate (0.5 - 2.0, default: 1.0) */
  rate?: number;
  /** Pitch (0.5 - 2.0, default: 1.0) */
  pitch?: number;
  /** Voice identifier (platform-specific) */
  voice?: string;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech completes */
  onDone?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Default speech configuration
 */
const DEFAULT_CONFIG: SpeechOptions = {
  language: "en-US",
  rate: 0.9,
  pitch: 1.0,
};

/**
 * Speaks the given text with optional configuration
 */
export const speak = async (
  text: string,
  options?: SpeechOptions
): Promise<void> => {
  try {
    // Check if speech is available
    const isAvailable = await Speech.isSpeakingAsync();

    // Stop current speech if playing
    if (isAvailable) {
      await Speech.stop();
    }

    // Merge with defaults
    const config = { ...DEFAULT_CONFIG, ...options };

    // Speak with configuration
    Speech.speak(text, {
      language: config.language,
      rate: config.rate,
      pitch: config.pitch,
      voice: config.voice,
      onStart: config.onStart,
      onDone: config.onDone,
      onError: config.onError,
    });
  } catch (error) {
    console.error("Speech error:", error);
    options?.onError?.(error as Error);
  }
};

/**
 * Stops any currently playing speech
 */
export const stopSpeech = async (): Promise<void> => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error("Error stopping speech:", error);
  }
};

/**
 * Pauses currently playing speech (iOS only)
 */
export const pauseSpeech = async (): Promise<void> => {
  try {
    if (Platform.OS === "ios") {
      await Speech.pause();
    } else {
      // Android doesn't support pause, so stop instead
      await Speech.stop();
    }
  } catch (error) {
    console.error("Error pausing speech:", error);
  }
};

/**
 * Resumes paused speech (iOS only)
 */
export const resumeSpeech = async (): Promise<void> => {
  try {
    if (Platform.OS === "ios") {
      await Speech.resume();
    }
  } catch (error) {
    console.error("Error resuming speech:", error);
  }
};

/**
 * Checks if speech is currently playing
 */
export const isSpeaking = async (): Promise<boolean> => {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error("Error checking speech status:", error);
    return false;
  }
};

/**
 * Checks if speech is paused (iOS only)
 */
export const isPaused = async (): Promise<boolean> => {
  try {
    if (Platform.OS === "ios") {
      return await Speech.isPausedAsync();
    }
    return false;
  } catch (error) {
    console.error("Error checking pause status:", error);
    return false;
  }
};

/**
 * Gets available voices for the platform
 */
export const getAvailableVoices = async () => {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    console.error("Error getting voices:", error);
    return [];
  }
};

/**
 * Language-specific configurations
 */
export const LANGUAGE_CONFIGS: Record<string, Partial<SpeechOptions>> = {
  en: {
    language: "en-US",
    rate: 0.9,
    pitch: 1.0,
  },
  ko: {
    language: "ko-KR",
    rate: 0.85,
    pitch: 1.0,
  },
  es: {
    language: "es-ES",
    rate: 0.9,
    pitch: 1.0,
  },
  fr: {
    language: "fr-FR",
    rate: 0.9,
    pitch: 1.0,
  },
  ja: {
    language: "ja-JP",
    rate: 0.85,
    pitch: 1.0,
  },
  zh: {
    language: "zh-CN",
    rate: 0.85,
    pitch: 1.0,
  },
};

/**
 * Gets language-specific configuration
 */
export const getLanguageConfig = (
  languageCode: string
): Partial<SpeechOptions> => {
  const baseCode = languageCode.split("-")[0];
  return LANGUAGE_CONFIGS[baseCode] || DEFAULT_CONFIG;
};

/**
 * Speaks text with auto-detected language configuration
 */
export const speakWithLanguage = async (
  text: string,
  languageCode: string,
  options?: SpeechOptions
): Promise<void> => {
  const langConfig = getLanguageConfig(languageCode);
  await speak(text, { ...langConfig, ...options });
};
