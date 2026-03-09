import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { SpeakerButton } from "../components/CollocationFlipCard/SpeakerButton";
import { SwipeCardItemWordMeaningSection } from "../components/swipe/SwipeCardItemWordMeaningSection";
import { WordCardActions } from "../components/wordbank/WordCardActions";
import { WordCardExample } from "../components/wordbank/WordCardExample";

const mockSpeak = jest.fn();
const mockStop = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
    stop: mockStop,
    pause: mockPause,
    resume: mockResume,
    isSpeaking: false,
    isPaused: false,
    error: null,
  }),
}));

jest.mock("../src/hooks/useSoundMode", () => ({
  useSoundMode: () => ({
    mode: "normal",
    isMuted: false,
    isVibrate: false,
    isNormal: true,
    volume: 1,
    volumePercentage: 100,
    volumeLevel: "high",
    isVolumeMuted: false,
    isVolumeLow: false,
    isLoading: false,
    rawValue: null,
    isAvailable: true,
  }),
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => null,
}));

jest.mock("../components/themed-text", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

describe("TTS entrypoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the shared speech hook from WordCardActions", async () => {
    const { getByText } = render(
      <WordCardActions
        word="abandon"
        wordId="1"
        onDelete={jest.fn()}
      />
    );

    fireEvent.press(getByText("volume-medium"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith("abandon", {
        language: "en-US",
        rate: 0.9,
      });
    });
  });

  it("uses the shared speech hook from the swipe card word section", async () => {
    const { getByText } = render(
      <SwipeCardItemWordMeaningSection
        item={{
          id: "1",
          word: "abandon",
          meaning: "to leave behind",
          example: "They abandoned the plan.",
          translation: "그들은 계획을 포기했다.",
          course: "TOEIC",
        }}
        word="abandon"
        meaning="to leave behind"
        isDark={false}
      />
    );

    fireEvent.press(getByText("volume-medium"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith("abandon", {
        language: "en-US",
        rate: 0.9,
      });
    });
  });

  it("uses the shared speech hook from word examples", async () => {
    const { getByText } = render(
      <WordCardExample
        example={`1. "She made a careful decision."`}
        translation="그녀는 신중한 결정을 내렸다."
      />
    );

    fireEvent.press(getByText(`"She made a careful decision."`));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith(`"She made a careful decision."`, {
        language: "en-US",
        pitch: 1,
        rate: 0.9,
      });
    });
  });

  it("uses the shared speech hook from the collocation speaker button", async () => {
    const { getByText } = render(
      <SpeakerButton text="make a decision" isDark={false} />
    );

    fireEvent.press(getByText("volume-high"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith("make a decision", {
        language: "en-US",
        rate: 0.9,
      });
    });
  });
});
