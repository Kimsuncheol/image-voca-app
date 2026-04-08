import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import CounterDetailScreen from "../app/counter-detail";

const mockGetCountersData = jest.fn();
const mockLanguage = { current: "en" };

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => ({
    id: "numbers-01",
    tab: "numbers",
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: jest.fn(),
  }),
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
  getCountersData: (...args: unknown[]) => mockGetCountersData(...args),
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
        "counters.colMeaning": "MEANING",
        "counters.colPronun": "PRONUN.",
        "counters.colExample": "EXAMPLE",
        "counters.tabs.numbers": "Numbers",
        "counters.loading": options?.defaultValue ?? "Loading...",
        "counters.loadError":
          options?.defaultValue ?? "Unable to load counters data.",
        "counters.detailNotFound":
          options?.defaultValue ?? "Counter details are unavailable.",
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("CounterDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage.current = "en";
    mockGetCountersData.mockResolvedValue([
      {
        id: "numbers-01",
        category: "",
        word: "一",
        meaningEnglish: "one",
        meaningKorean: "하나",
        pronunciation: "いち",
        pronunciationRoman: "ichi",
        example: "一つ",
        exampleRoman: "hitotsu",
        translationEnglish: "one item",
        translationKorean: "한 개",
      },
    ]);
  });

  it("loads and renders counter details from the selected tab collection", async () => {
    const screen = render(<CounterDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("一")).toBeTruthy();
      expect(screen.getAllByText("one").length).toBeGreaterThan(0);
      expect(screen.getByText("いち")).toBeTruthy();
      expect(screen.getByText("one item")).toBeTruthy();
    });

    expect(mockGetCountersData).toHaveBeenCalledWith("numbers");
  });
});
