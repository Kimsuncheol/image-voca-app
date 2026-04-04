import * as Speech from "expo-speech";
import {
  __resetSpeechServiceForTests,
  isPaused,
  isSpeaking,
  normalizeSpeechText,
  pauseSpeech,
  resumeSpeech,
  speak,
  splitSpeechPassage,
  stopSpeech,
} from "../src/services/speechService";

describe("speechService", () => {
  const speakMock = Speech.speak as jest.Mock;
  const stopMock = Speech.stop as jest.Mock;
  const pauseMock = Speech.pause as jest.Mock;
  const resumeMock = Speech.resume as jest.Mock;
  const waitForSpeakCalls = async (count: number) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (speakMock.mock.calls.length >= count) {
        return;
      }
      await Promise.resolve();
    }

    throw new Error(`Timed out waiting for ${count} speech calls.`);
  };

  beforeEach(async () => {
    await __resetSpeechServiceForTests();
    jest.clearAllMocks();
    stopMock.mockResolvedValue(undefined);
    pauseMock.mockResolvedValue(undefined);
    resumeMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await __resetSpeechServiceForTests();
  });

  it("normalizes text and splits long passages into ordered chunks", () => {
    expect(normalizeSpeechText(` "Hello   world" \n `)).toBe("Hello world");

    const chunks = splitSpeechPassage(
      "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu",
      20,
    );

    expect(chunks).toEqual([
      "alpha beta gamma",
      "delta epsilon zeta",
      "eta theta iota kappa",
      "lambda mu",
    ]);
    expect(chunks.every((chunk) => chunk.length <= 20)).toBe(true);
  });

  it("rejects empty speech text", async () => {
    await expect(speak(`  "   "  `)).rejects.toThrow("Speech text cannot be empty.");
    expect(speakMock).not.toHaveBeenCalled();
  });

  it("tracks single-utterance playback, pause, resume, and finish state", async () => {
    const speakPromise = speak("Vocabulary", {
      language: "en-US",
      rate: 0.9,
    });

    await waitForSpeakCalls(1);
    expect(speakMock).toHaveBeenCalledTimes(1);

    const speechOptions = speakMock.mock.calls[0][1];
    speechOptions.onStart?.();
    await Promise.resolve();

    expect(await isSpeaking()).toBe(true);
    expect(await isPaused()).toBe(false);

    await pauseSpeech();
    expect(pauseMock).toHaveBeenCalledTimes(1);
    expect(await isSpeaking()).toBe(false);
    expect(await isPaused()).toBe(true);

    await resumeSpeech();
    expect(resumeMock).toHaveBeenCalledTimes(1);
    expect(await isSpeaking()).toBe(true);
    expect(await isPaused()).toBe(false);

    speechOptions.onDone?.();
    await speakPromise;

    expect(await isSpeaking()).toBe(false);
    expect(await isPaused()).toBe(false);
  });

  it("stops active playback and clears speech state", async () => {
    const speakPromise = speak("Stop me", {
      language: "en-US",
      rate: 0.9,
    });

    await waitForSpeakCalls(1);
    const speechOptions = speakMock.mock.calls[0][1];
    speechOptions.onStart?.();
    await Promise.resolve();

    stopMock.mockClear();

    await stopSpeech();
    speechOptions.onStopped?.();
    await speakPromise;

    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(await isSpeaking()).toBe(false);
    expect(await isPaused()).toBe(false);
  });

  it("queues chunked passages sequentially and fires session callbacks once", async () => {
    const originalMaxSpeechInputLength = Speech.maxSpeechInputLength;
    const onStart = jest.fn();
    const onDone = jest.fn();

    Object.defineProperty(Speech, "maxSpeechInputLength", {
      value: 20,
      configurable: true,
      writable: true,
    });

    try {
      const longText =
        "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu";
      const expectedChunks = splitSpeechPassage(longText);

      const speakPromise = speak(longText, {
        language: "en-US",
        rate: 0.9,
        onStart,
        onDone,
      });

      await waitForSpeakCalls(1);
      expect(speakMock).toHaveBeenCalledTimes(1);
      expect(speakMock.mock.calls[0][0]).toBe(expectedChunks[0]);

      const firstChunkOptions = speakMock.mock.calls[0][1];
      firstChunkOptions.onStart?.();
      firstChunkOptions.onDone?.();
      await waitForSpeakCalls(2);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(speakMock).toHaveBeenCalledTimes(2);
      expect(speakMock.mock.calls[1][0]).toBe(expectedChunks[1]);

      const secondChunkOptions = speakMock.mock.calls[1][1];
      secondChunkOptions.onStart?.();
      secondChunkOptions.onDone?.();
      await waitForSpeakCalls(3);

      const thirdChunkOptions = speakMock.mock.calls[2][1];
      thirdChunkOptions.onStart?.();
      thirdChunkOptions.onDone?.();
      await waitForSpeakCalls(4);

      const fourthChunkOptions = speakMock.mock.calls[3][1];
      fourthChunkOptions.onStart?.();
      fourthChunkOptions.onDone?.();
      await speakPromise;

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(speakMock).toHaveBeenCalledTimes(expectedChunks.length);
      expect(await isSpeaking()).toBe(false);
      expect(await isPaused()).toBe(false);
    } finally {
      Object.defineProperty(Speech, "maxSpeechInputLength", {
        value: originalMaxSpeechInputLength,
        configurable: true,
        writable: true,
      });
    }
  });
});
