import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import ElementaryJapaneseScreen from "../app/elementary-japanese";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
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
    t: (key: string, options?: { defaultValue?: string }) => {
      const table: Record<string, string> = {
        "common.back": "Back",
        "elementaryJapanese.title": "Elementary Japanese",
        "elementaryJapanese.subtitle":
          "Start with characters and core building blocks",
        "elementaryJapanese.modules.kana.description":
          "Learn the Japanese character systems and practice recognition.",
        "elementaryJapanese.modules.prefixPostfix.description":
          "Study common Japanese prefixes and suffixes.",
        "elementaryJapanese.modules.counters.description":
          "Browse Japanese counters by category with examples.",
        "elementaryJapanese.modules.greeting.description":
          "Study essential Japanese greetings used in daily conversation.",
        "counters.title": "Counters",
        "greetings.title": "Greetings",
        "kana.title": "Hiragana & Katakana",
        "prefixPostfix.title": "Prefix & Postfix",
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("ElementaryJapaneseScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the elementary Japanese hub with four module entries", () => {
    const screen = render(<ElementaryJapaneseScreen />);

    expect(screen.getAllByText("Elementary Japanese").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Start with characters and core building blocks"),
    ).toBeTruthy();
    expect(screen.getByText("Hiragana & Katakana")).toBeTruthy();
    expect(screen.getByText("Prefix & Postfix")).toBeTruthy();
    expect(screen.getByText("Counters")).toBeTruthy();
    expect(screen.getByText("Greetings")).toBeTruthy();
  });

  it("routes to Japanese Characters, Prefix & Postfix, Counters, and Greetings", () => {
    const screen = render(<ElementaryJapaneseScreen />);

    fireEvent.press(screen.getByText("Hiragana & Katakana"));
    expect(mockPush).toHaveBeenCalledWith("/japanese-characters");

    fireEvent.press(screen.getByText("Prefix & Postfix"));
    expect(mockPush).toHaveBeenCalledWith("/prefix-postfix");

    fireEvent.press(screen.getByText("Counters"));
    expect(mockPush).toHaveBeenCalledWith("/counters");

    fireEvent.press(screen.getByText("Greetings"));
    expect(mockPush).toHaveBeenCalledWith("/japanese-greetings");
  });
});
