import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import FaceSide from "../components/CollocationFlipCard/FaceSide";
import { SpeakerButton } from "../components/CollocationFlipCard/SpeakerButton";
import { SwipeCardItemWordMeaningSection } from "../components/swipe/SwipeCardItemWordMeaningSection";
import { WordCard } from "../components/wordbank/WordCard";
import { WordCardExample } from "../components/wordbank/WordCardExample";

const mockSpeak = jest.fn();
const mockStop = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
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

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    recordWordLearned: jest.fn(),
  }),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
    i18n: {
      language: "en",
    },
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
    mockSpeak.mockResolvedValue(undefined);
  });

  it("uses the shared speech hook from the word card title", async () => {
    const { getByText } = render(
      <WordCard
        word={{
          id: "1",
          word: "abandon",
          meaning: "to leave behind",
          translation: "버리다",
          pronunciation: "/əˈbændən/",
          example: "They abandoned the plan.",
          course: "TOEIC",
          addedAt: "2026-01-01T00:00:00.000Z",
        }}
        isDark={false}
      />
    );

    fireEvent.press(getByText("abandon"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith("abandon", {
        language: "en-US",
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

    fireEvent.press(getByText("abandon"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith("abandon", {
        language: "en-US",
      });
    });
  });

  it("reads '='-separated swipe card word variants as separate utterances", async () => {
    mockSpeak.mockImplementation(async (_text, options) => {
      options?.onDone?.();
    });

    const { getByText, queryByText } = render(
      <SwipeCardItemWordMeaningSection
        item={{
          id: "1",
          word: "connection flight = connecting flight = connection",
          meaning: "a transfer flight",
          example: "I missed my connection.",
          translation: "나는 환승편을 놓쳤다.",
          course: "TOEIC",
        }}
        word="connection flight = connecting flight = connection"
        meaning="a transfer flight"
        isDark={false}
      />
    );

    expect(getByText("connecting flight")).toBeTruthy();
    expect(getByText("connection")).toBeTruthy();
    expect(queryByText(/=/)).toBeNull();

    fireEvent.press(getByText("connection flight"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledTimes(3);
    });

    expect(mockSpeak.mock.calls).toEqual([
      [
        "connection flight",
        expect.objectContaining({
          language: "en-US",
          onDone: expect.any(Function),
          onError: expect.any(Function),
        }),
      ],
      [
        "connecting flight",
        expect.objectContaining({
          language: "en-US",
          onDone: expect.any(Function),
          onError: expect.any(Function),
        }),
      ],
      [
        "connection",
        expect.objectContaining({
          language: "en-US",
          onDone: expect.any(Function),
          onError: expect.any(Function),
        }),
      ],
    ]);
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
      });
    });
  });

  it("uses the collocation title as the TTS trigger on the face side", async () => {
    const { getByText } = render(
      <FaceSide
        data={{
          collocation: "make a decision",
          meaning: "결정을 내리다",
          explanation: "",
          example: "She made a decision quickly.",
          translation: "그녀는 빨리 결정을 내렸다.",
        }}
        isDark={false}
        wordBankConfig={{
          id: "1",
          course: "COLLOCATION",
          enableAdd: false,
        }}
      />
    );

    fireEvent.press(getByText("make a decision"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith("make a decision", {
        language: "en-US",
      });
    });
  });

  it("reads '='-separated word card titles as separate utterances", async () => {
    mockSpeak.mockImplementation(async (_text, options) => {
      options?.onDone?.();
    });

    const { getByText } = render(
      <WordCard
        word={{
          id: "1",
          word: "connection flight = connecting flight = connection",
          meaning: "a transfer flight",
          translation: "환승 항공편",
          pronunciation: "",
          example: "We made our connection.",
          course: "TOEIC",
          addedAt: "2026-01-01T00:00:00.000Z",
        }}
        isDark={false}
      />
    );

    fireEvent.press(getByText("connection flight"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledTimes(3);
    });
  });

  it("reads '='-separated collocation titles as separate utterances", async () => {
    mockSpeak.mockImplementation(async (_text, options) => {
      options?.onDone?.();
    });

    const { getByText, queryByText } = render(
      <FaceSide
        data={{
          collocation: "connection flight = connecting flight = connection",
          meaning: "환승 항공편",
          explanation: "",
          example: "We made our connection.",
          translation: "우리는 환승에 성공했다.",
        }}
        isDark={false}
        wordBankConfig={{
          id: "1",
          course: "COLLOCATION",
          enableAdd: false,
        }}
      />
    );

    expect(getByText("connecting flight")).toBeTruthy();
    expect(getByText("connection")).toBeTruthy();
    expect(queryByText(/=/)).toBeNull();

    fireEvent.press(getByText("connection flight"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledTimes(3);
    });
  });
});
