import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Speech from "expo-speech";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import {
  __resetSpeechPreferencesForTests,
  setSpeechSpeedPreference,
} from "../../src/services/speechPreferences";
import { __resetSpeechServiceForTests } from "../../src/services/speechService";

function SpeechButton({
  language,
  rate,
}: {
  language?: string;
  rate?: number;
}) {
  const speech = useSpeech();
  return (
    <TouchableOpacity
      onPress={() => {
        void speech.speak("sample", { language, rate });
      }}
    >
      <Text>Speak</Text>
    </TouchableOpacity>
  );
}

describe("useSpeech", () => {
  const speakMock = Speech.speak as jest.Mock;

  beforeEach(async () => {
    await __resetSpeechServiceForTests();
    __resetSpeechPreferencesForTests();
    await AsyncStorage.clear();
    jest.clearAllMocks();
    speakMock.mockImplementation((_text: string, options?: { onDone?: () => void }) => {
      options?.onDone?.();
    });
  });

  afterEach(async () => {
    await act(async () => {
      await __resetSpeechServiceForTests();
    });
    __resetSpeechPreferencesForTests();
  });

  it("overrides English utterance rates with the saved English preference", async () => {
    await setSpeechSpeedPreference("en", "fast");
    const screen = render(<SpeechButton language="en-US" rate={0.9} />);

    await act(async () => {
      fireEvent.press(screen.getByText("Speak"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(speakMock).toHaveBeenCalledWith(
        "sample",
        expect.objectContaining({
          language: "en-US",
          rate: 1.1,
        }),
      );
    });
  });

  it("overrides Japanese utterance rates with the saved Japanese preference", async () => {
    await setSpeechSpeedPreference("ja", "slow");
    const screen = render(<SpeechButton language="ja-JP" rate={0.85} />);

    await act(async () => {
      fireEvent.press(screen.getByText("Speak"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(speakMock).toHaveBeenCalledWith(
        "sample",
        expect.objectContaining({
          language: "ja-JP",
          rate: 0.7,
        }),
      );
    });
  });

  it("uses the English preference for speech calls without an explicit language", async () => {
    await setSpeechSpeedPreference("en", "slow");
    const screen = render(<SpeechButton />);

    await act(async () => {
      fireEvent.press(screen.getByText("Speak"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(speakMock).toHaveBeenCalledWith(
        "sample",
        expect.objectContaining({
          language: undefined,
          rate: 0.75,
        }),
      );
    });
  });
});
