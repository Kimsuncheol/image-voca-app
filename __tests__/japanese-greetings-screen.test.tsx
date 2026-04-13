import { render } from "@testing-library/react-native";
import React from "react";

import JapaneseGreetingsScreen from "../app/japanese-greetings";

const mockLanguage = { current: "en" };

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: mockLanguage.current,
    },
    t: (key: string, options?: { defaultValue?: string }) => {
      const table: Record<string, string> = {
        "common.back": "Back",
        "elementaryJapanese.title": "Elementary Japanese",
        "greetings.title": "Greetings",
        "greetings.subtitle":
          "Study essential everyday Japanese greetings and tap any phrase to hear it spoken.",
        "greetings.colWord": "WORD",
        "greetings.colMeaning": "MEANING",
        "greetings.colPronunciation": "PRONUNCIATION",
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("JapaneseGreetingsScreen", () => {
  beforeEach(() => {
    mockLanguage.current = "en";
  });

  it("renders the hero content and visible greeting rows", () => {
    const screen = render(<JapaneseGreetingsScreen />);

    expect(screen.getAllByText("Greetings").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Study essential everyday Japanese greetings and tap any phrase to hear it spoken.",
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("ありがとうございます").length).toBeGreaterThan(0);
    expect(screen.getByText("Thank you")).toBeTruthy();
    expect(screen.getByText("しつれいします")).toBeTruthy();
  });

  it("switches the meaning column content when the app language is Korean", () => {
    mockLanguage.current = "ko";

    const screen = render(<JapaneseGreetingsScreen />);

    expect(screen.getByText("감사합니다")).toBeTruthy();
    expect(screen.queryByText("Thank you")).toBeNull();
  });
});
