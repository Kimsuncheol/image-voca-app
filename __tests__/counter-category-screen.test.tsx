import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import CounterCategoryScreen from "../app/counter-category";
import type { CounterTabId } from "../src/types/counters";

const mockGetCountersData = jest.fn();
const mockLanguage = { current: "en" };
const mockParams = { tab: "numbers" };
const mockSpeak = jest.fn();
const mockSpeakWordVariants = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
  }),
}));

jest.mock("../src/utils/wordVariants", () => ({
  speakWordVariants: (...args: unknown[]) => mockSpeakWordVariants(...args),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, ...props }: { children: React.ReactNode }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock("../src/services/countersService", () => ({
  getCountersData: (tab: CounterTabId) => mockGetCountersData(tab),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: mockLanguage.current,
    },
    t: (key: string, options?: { defaultValue?: string }) => {
      const table: Record<string, string> = {
        "common.back": "Back",
        "counters.title": "Counters",
        "counters.colCounter": "COUNTER",
        "counters.colMeaning": "MEANING",
        "counters.colPronun": "PRONUN.",
        "counters.colExample": "EXAMPLE",
        "counters.tabs.numbers": "Numbers",
        "counters.tabs.counter_tsuu": "Tsuu",
        "counters.loading": options?.defaultValue ?? "Loading...",
        "counters.empty": options?.defaultValue ?? "No counters found.",
        "counters.loadError":
          options?.defaultValue ?? "Unable to load counters data.",
        "counters.detailNotFound":
          options?.defaultValue ?? "Counter details are unavailable.",
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

const buildCounter = (
  id: string,
  word: string,
  meaningEnglish: string,
  meaningKorean = "뜻",
) => ({
  id,
  category: "",
  word,
  meaningEnglish,
  meaningKorean,
  pronunciation: "はつおん",
  pronunciationRoman: "hatsuon",
  example: `${word} の例`,
  exampleRoman: `${word} no rei`,
  translationEnglish: `${word} example`,
  translationKorean: `${word} 예문`,
});

describe("CounterCategoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage.current = "en";
    mockParams.tab = "numbers";
    mockGetCountersData.mockResolvedValue([
      buildCounter("numbers-01", "一", "one"),
      buildCounter("numbers-02", "二", "two"),
    ]);
  });

  it("loads and renders the selected tab collection", async () => {
    const screen = render(<CounterCategoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("一")).toBeTruthy();
      expect(screen.getByText("two")).toBeTruthy();
      expect(screen.getByText("COUNTER")).toBeTruthy();
    });

    expect(mockGetCountersData).toHaveBeenCalledWith("numbers");
  });

  it("renders rows as read-only content without navigating", async () => {
    const screen = render(<CounterCategoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("一")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("one"));
    expect(screen.queryByText("›")).toBeNull();
  });

  it("speaks the counter word in Japanese when the word is tapped", async () => {
    const screen = render(<CounterCategoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("一")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("一"));

    expect(mockSpeakWordVariants).toHaveBeenCalledWith(
      "一",
      mockSpeak,
      expect.objectContaining({
        language: "ja-JP",
        rate: 0.85,
      }),
    );
  });

  it("speaks the example sentence in Japanese when the example is tapped", async () => {
    const screen = render(<CounterCategoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("一 の例")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("一 の例"));

    expect(mockSpeak).toHaveBeenCalledWith(
      "一 の例",
      expect.objectContaining({
        language: "ja-JP",
        rate: 0.85,
      }),
    );
  });

  it("shows a safe error when the tab param is invalid", async () => {
    mockParams.tab = "invalid-tab";
    const screen = render(<CounterCategoryScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Counter details are unavailable."),
      ).toBeTruthy();
    });

    expect(mockGetCountersData).not.toHaveBeenCalled();
  });

  it("shows an error message when the Firestore fetch fails", async () => {
    mockGetCountersData.mockImplementation(() =>
      Promise.reject(new Error("fetch failed")),
    );
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const screen = render(<CounterCategoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load counters data.")).toBeTruthy();
    });

    warnSpy.mockRestore();
  });

  it("shows an empty state when the selected tab has no counters", async () => {
    mockGetCountersData.mockImplementation(() => Promise.resolve([]));
    const screen = render(<CounterCategoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("No counters found.")).toBeTruthy();
    });
  });
});
