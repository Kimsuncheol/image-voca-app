/**
 * Speech Service
 *
 * Centralized Text-to-Speech functionality backed by remote provider endpoints
 * with a local device fallback.
 */

import { Audio, type AVPlaybackStatus, type AVPlaybackStatusSuccess } from "expo-av";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface SpeechOptions {
  /** Language code (e.g., "en-US", "ko-KR") */
  language?: string;
  /** Speech rate (0.5 - 2.0, default: 1.0) */
  rate?: number;
  /** Pitch is unused by the remote provider and reserved for future support */
  pitch?: number;
  /** App-supported voice identifier */
  voice?: string;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech completes */
  onDone?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface SpeechVoiceOption {
  id: string;
  providerVoice: string;
  label: string;
  languages: string[];
}

interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
}

interface SpeechResponse {
  audioBase64: string;
  mimeType: string;
  cacheKey: string;
}

type SpeechBackend =
  | {
      kind: "remote-openai";
      endpoint: string;
      cacheNamespace: "openai";
    }
  | {
      kind: "remote-qwen";
      endpoint: string;
      cacheNamespace: "qwen";
    }
  | {
      kind: "local-device";
      cacheNamespace: "local-device";
    };

const DEFAULT_CONFIG: SpeechOptions = {
  language: "en-US",
  rate: 0.9,
  pitch: 1.0,
};

const TTS_CACHE_DIRECTORY = `${FileSystem.cacheDirectory ?? ""}openai-tts/`;

export const SUPPORTED_VOICES: SpeechVoiceOption[] = [
  {
    id: "Aiden",
    providerVoice: "alloy",
    label: "Aiden",
    languages: ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"],
  },
  {
    id: "Sohee",
    providerVoice: "nova",
    label: "Sohee",
    languages: ["ko", "en", "ja", "zh"],
  },
  {
    id: "Ono_Anna",
    providerVoice: "shimmer",
    label: "Ono Anna",
    languages: ["ja", "en", "ko", "zh"],
  },
];

const DEFAULT_VOICE_BY_LANGUAGE: Record<string, string> = {
  en: "Aiden",
  ja: "Ono_Anna",
  ko: "Sohee",
};

export const LANGUAGE_CONFIGS: Record<string, Partial<SpeechOptions>> = {
  en: {
    language: "en-US",
    rate: 0.9,
    pitch: 1.0,
    voice: "Aiden",
  },
  ko: {
    language: "ko-KR",
    rate: 0.85,
    pitch: 1.0,
    voice: "Sohee",
  },
  es: {
    language: "es-ES",
    rate: 0.9,
    pitch: 1.0,
    voice: "Aiden",
  },
  fr: {
    language: "fr-FR",
    rate: 0.9,
    pitch: 1.0,
    voice: "Aiden",
  },
  ja: {
    language: "ja-JP",
    rate: 0.85,
    pitch: 1.0,
    voice: "Ono_Anna",
  },
  zh: {
    language: "zh-CN",
    rate: 0.85,
    pitch: 1.0,
    voice: "Aiden",
  },
};

let currentSound: Audio.Sound | null = null;
let currentPlaybackToken = 0;
let audioModeConfigured = false;
let cacheDirectoryReady = false;
let speechState: SpeechState = { isSpeaking: false, isPaused: false };
let activeBackend: SpeechBackend["kind"] | null = null;
const speechListeners = new Set<(state: SpeechState) => void>();

const clampRate = (rate: number | undefined): number => {
  const fallbackRate = DEFAULT_CONFIG.rate ?? 1;
  if (typeof rate !== "number" || Number.isNaN(rate)) {
    return fallbackRate;
  }
  return Math.min(2, Math.max(0.5, rate));
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

const setSpeechState = (nextState: Partial<SpeechState>) => {
  speechState = { ...speechState, ...nextState };
  speechListeners.forEach((listener) => listener(speechState));
};

const resolveVoiceId = (languageCode?: string, voice?: string): string => {
  if (voice && SUPPORTED_VOICES.some((item) => item.id === voice)) {
    return voice;
  }

  const baseCode = getBaseLanguageCode(languageCode);
  return DEFAULT_VOICE_BY_LANGUAGE[baseCode] || "Aiden";
};

const getSpeechBackend = (): SpeechBackend => {
  const openAiEndpoint = process.env.EXPO_PUBLIC_OPENAI_TTS_ENDPOINT?.trim();
  if (openAiEndpoint) {
    return {
      kind: "remote-openai",
      endpoint: openAiEndpoint,
      cacheNamespace: "openai",
    };
  }

  const qwenEndpoint = process.env.EXPO_PUBLIC_QWEN_TTS_ENDPOINT?.trim();
  if (qwenEndpoint) {
    return {
      kind: "remote-qwen",
      endpoint: qwenEndpoint,
      cacheNamespace: "qwen",
    };
  }

  return {
    kind: "local-device",
    cacheNamespace: "local-device",
  };
};

const ensureCacheDirectory = async () => {
  if (cacheDirectoryReady || !TTS_CACHE_DIRECTORY) {
    return;
  }

  const directoryInfo = await FileSystem.getInfoAsync(TTS_CACHE_DIRECTORY);
  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(TTS_CACHE_DIRECTORY, {
      intermediates: true,
    });
  }
  cacheDirectoryReady = true;
};

const ensureAudioMode = async () => {
  if (audioModeConfigured) {
    return;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  });
  audioModeConfigured = true;
};

const getCacheFileUri = (cacheKey: string): string =>
  `${TTS_CACHE_DIRECTORY}${cacheKey}.mp3`;

const isPlaybackStatusSuccess = (
  status: AVPlaybackStatus
): status is AVPlaybackStatusSuccess => status.isLoaded;

const unloadCurrentSound = async () => {
  if (!currentSound) {
    return;
  }

  const soundToUnload = currentSound;
  currentSound = null;
  soundToUnload.setOnPlaybackStatusUpdate(null);
  await soundToUnload.unloadAsync();
};

const stopActiveSound = async () => {
  try {
    await unloadCurrentSound();
  } catch (error) {
    console.error("Error unloading speech audio:", error);
  } finally {
    setSpeechState({ isSpeaking: false, isPaused: false });
  }
};

const stopLocalSpeech = async () => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error("Error stopping local speech:", error);
  } finally {
    setSpeechState({ isSpeaking: false, isPaused: false });
  }
};

const stopActivePlayback = async () => {
  if (activeBackend === "local-device") {
    await stopLocalSpeech();
    activeBackend = null;
    return;
  }

  await stopActiveSound();
  activeBackend = null;
};

const normalizeResponseError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (data?.message) {
      return data.message;
    }
  } catch {
    // Ignore JSON parse errors and fall through to status text.
  }

  return response.statusText || "Speech synthesis failed.";
};

const handlePlaybackStatus = (
  status: AVPlaybackStatus,
  playbackToken: number,
  options?: SpeechOptions
) => {
  if (playbackToken !== currentPlaybackToken) {
    return;
  }

  if (!isPlaybackStatusSuccess(status)) {
    if (status.error) {
      const error = new Error(status.error);
      setSpeechState({ isSpeaking: false, isPaused: false });
      options?.onError?.(error);
      void stopActiveSound();
    }
    return;
  }

  if (status.didJustFinish) {
    setSpeechState({ isSpeaking: false, isPaused: false });
    options?.onDone?.();
    void stopActiveSound();
    return;
  }

  if (status.isPlaying) {
    setSpeechState({ isSpeaking: true, isPaused: false });
    return;
  }

  if (status.positionMillis > 0 && status.positionMillis < (status.durationMillis ?? 0)) {
    setSpeechState({ isSpeaking: false, isPaused: true });
  }
};

export const normalizeSpeechText = (text: string): string =>
  stripSurroundingQuotes(text).replace(/\s+/g, " ").trim();

export const buildSpeechCacheKey = async (
  text: string,
  options?: SpeechOptions
): Promise<string> => {
  const normalizedText = normalizeSpeechText(text);
  const language = options?.language || DEFAULT_CONFIG.language || "en-US";
  const voice = resolveVoiceId(language, options?.voice);
  const rate = clampRate(options?.rate);
  const backend = getSpeechBackend();

  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    JSON.stringify({
      backend: backend.cacheNamespace,
      text: normalizedText,
      language,
      voice,
      rate,
    })
  );
};

const fetchSpeechAudio = async (
  text: string,
  backend: Extract<SpeechBackend, { kind: "remote-openai" | "remote-qwen" }>,
  options?: SpeechOptions
): Promise<SpeechResponse> => {
  const normalizedText = normalizeSpeechText(text);
  const response = await fetch(backend.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: normalizedText,
      language: options?.language || DEFAULT_CONFIG.language,
      rate: clampRate(options?.rate),
      voice: resolveVoiceId(options?.language, options?.voice),
    }),
  });

  if (!response.ok) {
    throw new Error(await normalizeResponseError(response));
  }

  const payload = (await response.json()) as Partial<SpeechResponse>;
  if (!payload.audioBase64 || !payload.cacheKey) {
    throw new Error("Speech endpoint response is missing audio data.");
  }

  return {
    audioBase64: payload.audioBase64,
    mimeType: payload.mimeType || "audio/mpeg",
    cacheKey: payload.cacheKey,
  };
};

const resolveLocalVoiceIdentifier = async (
  languageCode?: string
): Promise<string | undefined> => {
  try {
    const availableVoices = await Speech.getAvailableVoicesAsync();
    const baseCode = getBaseLanguageCode(languageCode);

    const exactMatch = availableVoices.find(
      (voice) => voice.language?.toLowerCase() === (languageCode || "").toLowerCase()
    );
    if (exactMatch?.identifier) {
      return exactMatch.identifier;
    }

    const baseMatch = availableVoices.find((voice) =>
      voice.language?.toLowerCase().startsWith(`${baseCode}-`)
    );
    return baseMatch?.identifier;
  } catch (error) {
    console.error("Error loading local speech voices:", error);
    return undefined;
  }
};

const speakWithLocalDevice = async (
  text: string,
  options?: SpeechOptions,
  playbackToken?: number
) => {
  const activeToken = playbackToken ?? currentPlaybackToken;
  const voice = await resolveLocalVoiceIdentifier(options?.language);

  if (activeToken !== currentPlaybackToken) {
    return;
  }

  activeBackend = "local-device";

  Speech.speak(text, {
    language: options?.language,
    pitch: options?.pitch,
    rate: clampRate(options?.rate),
    voice,
    onStart: () => {
      if (activeToken !== currentPlaybackToken) {
        return;
      }
      setSpeechState({ isSpeaking: true, isPaused: false });
      options?.onStart?.();
    },
    onDone: () => {
      if (activeToken !== currentPlaybackToken) {
        return;
      }
      activeBackend = null;
      setSpeechState({ isSpeaking: false, isPaused: false });
      options?.onDone?.();
    },
    onStopped: () => {
      if (activeToken !== currentPlaybackToken) {
        return;
      }
      activeBackend = null;
      setSpeechState({ isSpeaking: false, isPaused: false });
      options?.onDone?.();
    },
    onError: (error) => {
      if (activeToken !== currentPlaybackToken) {
        return;
      }
      activeBackend = null;
      const normalizedError = new Error(error?.message || "Local speech failed.");
      setSpeechState({ isSpeaking: false, isPaused: false });
      options?.onError?.(normalizedError);
    },
  });
};

const playFromFile = async (
  fileUri: string,
  options?: SpeechOptions,
  playbackToken?: number
) => {
  await ensureAudioMode();

  const activeToken = playbackToken ?? currentPlaybackToken;
  const { sound } = await Audio.Sound.createAsync(
    { uri: fileUri },
    { shouldPlay: false },
    (status) => handlePlaybackStatus(status, activeToken, options)
  );

  if (activeToken !== currentPlaybackToken) {
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync();
    return;
  }

  currentSound = sound;
  await sound.setRateAsync(clampRate(options?.rate), true);
  await sound.playAsync();
  setSpeechState({ isSpeaking: true, isPaused: false });
  options?.onStart?.();
};

export const speak = async (
  text: string,
  options?: SpeechOptions
): Promise<void> => {
  const normalizedText = normalizeSpeechText(text);

  if (!normalizedText) {
    const error = new Error("Speech text cannot be empty.");
    options?.onError?.(error);
    throw error;
  }

  const config = { ...DEFAULT_CONFIG, ...options };
  const playbackToken = ++currentPlaybackToken;
  const backend = getSpeechBackend();

  try {
    await stopActivePlayback();

    if (backend.kind === "local-device") {
      await speakWithLocalDevice(normalizedText, config, playbackToken);
      return;
    }

    const cacheKey = await buildSpeechCacheKey(normalizedText, config);
    const fileUri = getCacheFileUri(cacheKey);

    await ensureCacheDirectory();

    const cacheInfo = await FileSystem.getInfoAsync(fileUri);
    if (!cacheInfo.exists) {
      const synthesizedAudio = await fetchSpeechAudio(normalizedText, backend, config);
      await FileSystem.writeAsStringAsync(fileUri, synthesizedAudio.audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    if (playbackToken !== currentPlaybackToken) {
      return;
    }

    activeBackend = backend.kind;
    await playFromFile(fileUri, config, playbackToken);
  } catch (error) {
    activeBackend = null;
    setSpeechState({ isSpeaking: false, isPaused: false });
    console.error("Speech error:", error);
    options?.onError?.(error as Error);
    throw error;
  }
};

export const stopSpeech = async (): Promise<void> => {
  currentPlaybackToken += 1;
  await stopActivePlayback();
};

export const pauseSpeech = async (): Promise<void> => {
  try {
    if (activeBackend === "local-device") {
      if (Platform.OS === "android") {
        return;
      }

      await Speech.pause();
      setSpeechState({ isSpeaking: false, isPaused: true });
      return;
    }

    if (!currentSound) {
      return;
    }

    await currentSound.pauseAsync();
    setSpeechState({ isSpeaking: false, isPaused: true });
  } catch (error) {
    console.error("Error pausing speech:", error);
    throw error;
  }
};

export const resumeSpeech = async (): Promise<void> => {
  try {
    if (activeBackend === "local-device") {
      if (Platform.OS === "android") {
        return;
      }

      await Speech.resume();
      setSpeechState({ isSpeaking: true, isPaused: false });
      return;
    }

    if (!currentSound) {
      return;
    }

    await currentSound.playAsync();
    setSpeechState({ isSpeaking: true, isPaused: false });
  } catch (error) {
    console.error("Error resuming speech:", error);
    throw error;
  }
};

export const isSpeaking = async (): Promise<boolean> => speechState.isSpeaking;

export const isPaused = async (): Promise<boolean> => speechState.isPaused;

export const getAvailableVoices = async () => SUPPORTED_VOICES;

export const subscribeToSpeechState = (
  listener: (state: SpeechState) => void
): (() => void) => {
  speechListeners.add(listener);
  listener(speechState);

  return () => {
    speechListeners.delete(listener);
  };
};

export const getLanguageConfig = (
  languageCode: string
): Partial<SpeechOptions> => {
  const baseCode = getBaseLanguageCode(languageCode);
  return LANGUAGE_CONFIGS[baseCode] || DEFAULT_CONFIG;
};

export const speakWithLanguage = async (
  text: string,
  languageCode: string,
  options?: SpeechOptions
): Promise<void> => {
  const langConfig = getLanguageConfig(languageCode);
  await speak(text, { ...langConfig, ...options });
};

export const __resetSpeechServiceForTests = async () => {
  currentPlaybackToken += 1;
  await stopActivePlayback();
  speechListeners.clear();
  audioModeConfigured = false;
  cacheDirectoryReady = false;
  activeBackend = null;
  speechState = { isSpeaking: false, isPaused: false };
};
