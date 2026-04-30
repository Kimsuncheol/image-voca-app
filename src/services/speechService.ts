/**
 * Speech Service
 *
 * Centralized Text-to-Speech functionality backed by expo-speech.
 */

import * as Speech from "expo-speech";
import type { Voice } from "expo-speech";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Platform } from "react-native";

export interface SpeechOptions {
  /** Language code (e.g., "en-US", "ko-KR") */
  language?: string;
  /** Speech rate (0.5 - 2.0, default: 1.0) */
  rate?: number;
  /** Speech pitch (0.5 - 2.0, default: 1.0) */
  pitch?: number;
  /** Native expo-speech voice identifier */
  voice?: string;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech completes */
  onDone?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
}

type SpeechVoice = Voice;

const DEFAULT_CONFIG: SpeechOptions = {
  language: "en-US",
  rate: 0.9,
  pitch: 1.0,
};

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

let currentPlaybackToken = 0;
let speechState: SpeechState = { isSpeaking: false, isPaused: false };
const speechListeners = new Set<(state: SpeechState) => void>();
let availableVoicesCache: SpeechVoice[] | null = null;
let availableVoicesPromise: Promise<SpeechVoice[]> | null = null;

const SPEECH_AUDIO_MODE = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  shouldDuckAndroid: false,
  staysActiveInBackground: false,
  playThroughEarpieceAndroid: false,
} as const;

const DEFAULT_AUDIO_MODE = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: false,
  interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  shouldDuckAndroid: true,
  staysActiveInBackground: false,
  playThroughEarpieceAndroid: false,
} as const;

const configureSpeechAudioMode = () =>
  Audio.setAudioModeAsync(SPEECH_AUDIO_MODE);

const resetSpeechAudioMode = () =>
  Audio.setAudioModeAsync(DEFAULT_AUDIO_MODE);

const clampRate = (rate: number | undefined): number => {
  const fallbackRate = DEFAULT_CONFIG.rate ?? 1;
  if (typeof rate !== "number" || Number.isNaN(rate)) {
    return fallbackRate;
  }
  return Math.min(2, Math.max(0.5, rate));
};

const clampPitch = (pitch: number | undefined): number => {
  const fallbackPitch = DEFAULT_CONFIG.pitch ?? 1;
  if (typeof pitch !== "number" || Number.isNaN(pitch)) {
    return fallbackPitch;
  }
  return Math.min(2, Math.max(0.5, pitch));
};

const stripSurroundingQuotes = (text: string): string => {
  const trimmedText = text.trim();
  if (
    (trimmedText.startsWith('"') && trimmedText.endsWith('"')) ||
    (trimmedText.startsWith("'") && trimmedText.endsWith("'"))
  ) {
    return trimmedText.slice(1, -1).trim();
  }
  return trimmedText;
};

const getBaseLanguageCode = (languageCode?: string): string =>
  (languageCode || DEFAULT_CONFIG.language || "en-US").split("-")[0].toLowerCase();

const normalizeLanguageTag = (languageCode?: string): string =>
  (languageCode || DEFAULT_CONFIG.language || "en-US")
    .trim()
    .replace(/_/g, "-")
    .toLowerCase();

const getLanguageCandidates = (languageCode?: string): string[] => {
  const normalizedLanguage = normalizeLanguageTag(languageCode);
  const baseLanguage = getBaseLanguageCode(normalizedLanguage);

  return [...new Set([normalizedLanguage, baseLanguage].filter(Boolean))];
};

const setSpeechState = (nextState: Partial<SpeechState>) => {
  speechState = { ...speechState, ...nextState };
  speechListeners.forEach((listener) => listener(speechState));
};

const getSpeechInputLimit = () => {
  const candidate = Speech.maxSpeechInputLength;
  if (typeof candidate !== "number" || !Number.isFinite(candidate) || candidate <= 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  return candidate;
};

const runSpeechMethod = async (
  method: (() => Promise<void>) | undefined,
): Promise<void> => {
  if (typeof method !== "function") {
    return;
  }

  await method();
};

const stopActivePlayback = async () => {
  try {
    await runSpeechMethod(Speech.stop);
  } finally {
    setSpeechState({ isSpeaking: false, isPaused: false });
  }
};

const createSpeechError = (error: unknown): Error =>
  error instanceof Error ? error : new Error("Speech synthesis failed.");

const getAvailableVoices = async (): Promise<SpeechVoice[]> => {
  if (availableVoicesCache) {
    return availableVoicesCache;
  }

  if (!availableVoicesPromise) {
    availableVoicesPromise = Speech.getAvailableVoicesAsync()
      .then((voices) => {
        availableVoicesCache = voices;
        return voices;
      })
      .catch((error) => {
        availableVoicesPromise = null;
        throw error;
      });
  }

  return availableVoicesPromise;
};

const findMatchingVoice = (
  voices: SpeechVoice[],
  requestedLanguage?: string,
): SpeechVoice | undefined => {
  const requestedCandidates = getLanguageCandidates(requestedLanguage);
  const requestedExactLanguage = requestedCandidates[0];
  const requestedBaseLanguage = getBaseLanguageCode(requestedLanguage);

  const exactMatch = voices.find(
    (voice) => normalizeLanguageTag(voice.language) === requestedExactLanguage,
  );
  if (exactMatch) {
    return exactMatch;
  }

  return voices.find(
    (voice) => getBaseLanguageCode(normalizeLanguageTag(voice.language)) === requestedBaseLanguage,
  );
};

const resolveSpeechOptions = async (
  options: SpeechOptions,
): Promise<SpeechOptions> => {
  if (Platform.OS !== "android") {
    return options;
  }

  const requestedLanguage = options.language || DEFAULT_CONFIG.language || "en-US";
  const baseLanguage = getBaseLanguageCode(requestedLanguage);

  if (!baseLanguage) {
    return options;
  }

  if (options.voice) {
    return { ...options, language: baseLanguage };
  }

  try {
    const availableVoices = await getAvailableVoices();
    const matchingVoice = findMatchingVoice(availableVoices, requestedLanguage);

    if (!matchingVoice) {
      throw new Error(
        `No Android TTS voice available for language "${requestedLanguage}" (base "${baseLanguage}").`,
      );
    }

    return {
      ...options,
      language: baseLanguage,
      voice: matchingVoice.identifier,
    };
  } catch (error) {
    const speechError = createSpeechError(error);

    if (speechError.message.startsWith("No Android TTS voice available")) {
      throw speechError;
    }

    return {
      ...options,
      language: baseLanguage,
    };
  }
};

export const normalizeSpeechText = (text: string): string =>
  stripSurroundingQuotes(text).replace(/\s+/g, " ").trim();

export const splitSpeechPassage = (
  text: string,
  maxLength = getSpeechInputLimit(),
): string[] => {
  const normalizedText = normalizeSpeechText(text);
  if (!normalizedText) {
    return [];
  }

  if (normalizedText.length <= maxLength) {
    return [normalizedText];
  }

  const words = normalizedText.split(" ");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    if (word.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      let offset = 0;
      while (offset < word.length) {
        chunks.push(word.slice(offset, offset + maxLength));
        offset += maxLength;
      }
      continue;
    }

    const nextChunk = currentChunk ? `${currentChunk} ${word}` : word;
    if (nextChunk.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = word;
    } else {
      currentChunk = nextChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

const speakChunk = (
  text: string,
  options: SpeechOptions,
  playbackToken: number,
  isFirstChunk: boolean,
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;

      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    Speech.speak(text, {
      language: options.language,
      rate: clampRate(options.rate),
      pitch: clampPitch(options.pitch),
      voice: options.voice,
      onStart: () => {
        if (playbackToken !== currentPlaybackToken) {
          return;
        }

        setSpeechState({ isSpeaking: true, isPaused: false });
        if (isFirstChunk) {
          options.onStart?.();
        }
      },
      onDone: () => {
        if (playbackToken !== currentPlaybackToken) {
          finish();
          return;
        }
        finish();
      },
      onStopped: () => {
        finish();
      },
      onPause: () => {
        if (playbackToken !== currentPlaybackToken) {
          return;
        }
        setSpeechState({ isSpeaking: false, isPaused: true });
      },
      onResume: () => {
        if (playbackToken !== currentPlaybackToken) {
          return;
        }
        setSpeechState({ isSpeaking: true, isPaused: false });
      },
      onError: (error) => {
        finish(createSpeechError(error));
      },
    });
  });

export const speak = async (
  text: string,
  options?: SpeechOptions,
): Promise<void> => {
  const normalizedText = normalizeSpeechText(text);

  if (!normalizedText) {
    const error = new Error("Speech text cannot be empty.");
    options?.onError?.(error);
    throw error;
  }

  const config = await resolveSpeechOptions({ ...DEFAULT_CONFIG, ...options });
  const chunks = splitSpeechPassage(normalizedText);
  const playbackToken = ++currentPlaybackToken;
  let didConfigureAudioMode = false;

  try {
    await stopActivePlayback();
    await configureSpeechAudioMode();
    didConfigureAudioMode = true;

    for (let index = 0; index < chunks.length; index += 1) {
      if (playbackToken !== currentPlaybackToken) {
        return;
      }

      await speakChunk(chunks[index], config, playbackToken, index === 0);
    }

    if (playbackToken !== currentPlaybackToken) {
      return;
    }

    setSpeechState({ isSpeaking: false, isPaused: false });
    options?.onDone?.();
  } catch (error) {
    const speechError = createSpeechError(error);
    if (playbackToken === currentPlaybackToken) {
      setSpeechState({ isSpeaking: false, isPaused: false });
      options?.onError?.(speechError);
    }
    throw speechError;
  } finally {
    if (didConfigureAudioMode && playbackToken === currentPlaybackToken) {
      await resetSpeechAudioMode();
    }
  }
};

export const speakWord = (
  text: string,
  options?: SpeechOptions,
): Promise<void> => speak(text, options);

export const stopSpeech = async (): Promise<void> => {
  currentPlaybackToken += 1;
  try {
    await stopActivePlayback();
  } finally {
    await resetSpeechAudioMode();
  }
};

export const pauseSpeech = async (): Promise<void> => {
  try {
    await runSpeechMethod(Speech.pause);
    setSpeechState({ isSpeaking: false, isPaused: true });
  } catch (error) {
    console.error("Error pausing speech:", error);
    throw error;
  }
};

export const resumeSpeech = async (): Promise<void> => {
  try {
    await runSpeechMethod(Speech.resume);
    setSpeechState({ isSpeaking: true, isPaused: false });
  } catch (error) {
    console.error("Error resuming speech:", error);
    throw error;
  }
};

export const isSpeaking = async (): Promise<boolean> => speechState.isSpeaking;

export const isPaused = async (): Promise<boolean> => speechState.isPaused;

export const subscribeToSpeechState = (
  listener: (state: SpeechState) => void,
): (() => void) => {
  speechListeners.add(listener);
  listener(speechState);

  return () => {
    speechListeners.delete(listener);
  };
};

export const getLanguageConfig = (
  languageCode: string,
): Partial<SpeechOptions> => {
  const baseCode = getBaseLanguageCode(languageCode);
  return LANGUAGE_CONFIGS[baseCode] || DEFAULT_CONFIG;
};

export const speakWithLanguage = async (
  text: string,
  languageCode: string,
  options?: SpeechOptions,
): Promise<void> => {
  const langConfig = getLanguageConfig(languageCode);
  await speak(text, { ...langConfig, ...options });
};

export const __resetSpeechServiceForTests = async () => {
  currentPlaybackToken += 1;
  await stopActivePlayback();
  speechListeners.clear();
  availableVoicesCache = null;
  availableVoicesPromise = null;
  speechState = { isSpeaking: false, isPaused: false };
};
