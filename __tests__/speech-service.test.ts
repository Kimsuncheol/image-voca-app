import { Audio } from "expo-av";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import {
  __resetSpeechServiceForTests,
  buildSpeechCacheKey,
  isPaused,
  isSpeaking,
  normalizeSpeechText,
  pauseSpeech,
  resumeSpeech,
  speak,
  stopSpeech,
} from "../src/services/speechService";

describe("speechService", () => {
  const createAsyncMock = Audio.Sound.createAsync as unknown as jest.Mock;
  const setAudioModeAsyncMock = Audio.setAudioModeAsync as jest.Mock;
  const digestStringAsyncMock = Crypto.digestStringAsync as jest.Mock;
  const getInfoAsyncMock = FileSystem.getInfoAsync as jest.Mock;
  const makeDirectoryAsyncMock = FileSystem.makeDirectoryAsync as jest.Mock;
  const writeAsStringAsyncMock = FileSystem.writeAsStringAsync as jest.Mock;

  let existingUris: Set<string>;
  let playbackStatusHandler: ((status: any) => void) | null;
  let soundMock: {
    setOnPlaybackStatusUpdate: jest.Mock;
    unloadAsync: jest.Mock;
    playAsync: jest.Mock;
    pauseAsync: jest.Mock;
    setRateAsync: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    existingUris = new Set();
    playbackStatusHandler = null;
    process.env.EXPO_PUBLIC_OPENAI_TTS_ENDPOINT = "https://example.com/openai-tts";
    process.env.EXPO_PUBLIC_QWEN_TTS_ENDPOINT = "https://example.com/qwen-tts";

    soundMock = {
      setOnPlaybackStatusUpdate: jest.fn(),
      unloadAsync: jest.fn(async () => ({
        isLoaded: true,
        isPlaying: false,
        didJustFinish: false,
        positionMillis: 0,
        durationMillis: 1000,
      })),
      playAsync: jest.fn(async () => ({
        isLoaded: true,
        isPlaying: true,
        didJustFinish: false,
        positionMillis: 0,
        durationMillis: 1000,
      })),
      pauseAsync: jest.fn(async () => ({
        isLoaded: true,
        isPlaying: false,
        didJustFinish: false,
        positionMillis: 200,
        durationMillis: 1000,
      })),
      setRateAsync: jest.fn(async () => ({
        isLoaded: true,
        isPlaying: false,
        didJustFinish: false,
        positionMillis: 0,
        durationMillis: 1000,
      })),
    };

    createAsyncMock.mockImplementation(
      async (_source, _initialStatus, onPlaybackStatusUpdate) => {
        playbackStatusHandler = onPlaybackStatusUpdate;
        return {
          sound: soundMock,
          status: {
            isLoaded: true,
            isPlaying: false,
            didJustFinish: false,
            positionMillis: 0,
            durationMillis: 1000,
          },
        };
      }
    );

    setAudioModeAsyncMock.mockResolvedValue(undefined);
    digestStringAsyncMock.mockImplementation(
      async (_algorithm, value) => `hash:${value}`
    );
    getInfoAsyncMock.mockImplementation(async (uri: string) => ({
      exists: existingUris.has(uri),
      isDirectory: uri.endsWith("/"),
    }));
    makeDirectoryAsyncMock.mockImplementation(async (uri: string) => {
      existingUris.add(uri);
    });
    writeAsStringAsyncMock.mockImplementation(async (uri: string) => {
      existingUris.add(uri);
    });

    global.fetch = jest.fn();

    await __resetSpeechServiceForTests();
  });

  afterEach(async () => {
    await __resetSpeechServiceForTests();
  });

  it("normalizes speech text and builds a stable cache key", async () => {
    expect(normalizeSpeechText(` "Hello   world" \n `)).toBe("Hello world");

    await buildSpeechCacheKey(`"안녕   하세요"`, {
      language: "ko-KR",
      rate: 0.85,
    });

    expect(digestStringAsyncMock).toHaveBeenCalledWith(
      "SHA256",
      JSON.stringify({
        backend: "openai",
        text: "안녕 하세요",
        language: "ko-KR",
        voice: "Sohee",
        rate: 0.85,
      })
    );
  });

  it("downloads synthesized audio once and reuses the cached file", async () => {
    const cacheKey = await buildSpeechCacheKey("Hello world", {
      language: "en-US",
      rate: 0.9,
      voice: "Aiden",
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        audioBase64: "ZmFrZS1hdWRpbw==",
        mimeType: "audio/mpeg",
        cacheKey,
      }),
    });

    await speak(`"Hello   world"`, {
      language: "en-US",
      rate: 0.9,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/openai-tts",
      expect.any(Object)
    );
    expect(writeAsStringAsyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`${cacheKey}.mp3`),
      "ZmFrZS1hdWRpbw==",
      { encoding: "base64" }
    );

    await stopSpeech();
    (global.fetch as jest.Mock).mockClear();

    await speak("Hello world", {
      language: "en-US",
      rate: 0.9,
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(createAsyncMock).toHaveBeenCalledTimes(2);
  });

  it("tracks play, pause, resume, and finish state through expo-av", async () => {
    const cacheKey = await buildSpeechCacheKey("Vocabulary", {
      language: "en-US",
      rate: 0.9,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        audioBase64: "ZmFrZS1hdWRpbw==",
        mimeType: "audio/mpeg",
        cacheKey,
      }),
    });

    await speak("Vocabulary", {
      language: "en-US",
      rate: 0.9,
    });

    expect(await isSpeaking()).toBe(true);
    expect(await isPaused()).toBe(false);

    await pauseSpeech();
    expect(soundMock.pauseAsync).toHaveBeenCalled();
    expect(await isSpeaking()).toBe(false);
    expect(await isPaused()).toBe(true);

    await resumeSpeech();
    expect(soundMock.playAsync).toHaveBeenCalledTimes(2);
    expect(await isSpeaking()).toBe(true);
    expect(await isPaused()).toBe(false);

    playbackStatusHandler?.({
      isLoaded: true,
      isPlaying: false,
      didJustFinish: true,
      positionMillis: 1000,
      durationMillis: 1000,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(await isSpeaking()).toBe(false);
    expect(await isPaused()).toBe(false);
    expect(soundMock.unloadAsync).toHaveBeenCalled();
  });

  it("falls back to the legacy TTS endpoint env var when the preferred one is absent", async () => {
    delete process.env.EXPO_PUBLIC_OPENAI_TTS_ENDPOINT;

    const cacheKey = await buildSpeechCacheKey("Fallback", {
      language: "en-US",
      rate: 0.9,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        audioBase64: "ZmFrZS1hdWRpbw==",
        mimeType: "audio/mpeg",
        cacheKey,
      }),
    });

    await speak("Fallback", {
      language: "en-US",
      rate: 0.9,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/qwen-tts",
      expect.any(Object)
    );
  });

  it("throws a configuration error when no remote endpoint is configured", async () => {
    delete process.env.EXPO_PUBLIC_OPENAI_TTS_ENDPOINT;
    delete process.env.EXPO_PUBLIC_QWEN_TTS_ENDPOINT;

    await expect(
      speak("Configuration required", {
        language: "en-US",
        rate: 0.9,
      })
    ).rejects.toThrow(
      "EXPO_PUBLIC_OPENAI_TTS_ENDPOINT or EXPO_PUBLIC_QWEN_TTS_ENDPOINT must be configured."
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
