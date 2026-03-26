import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import PrefixPostfixScreen from "../app/prefix-postfix";

const mockGetPrefixPostfixData = jest.fn();
const mockLanguage = { current: "en" };

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: { children: React.ReactNode }) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

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

jest.mock("../src/services/prefixPostfixService", () => ({
  getPrefixPostfixData: () => mockGetPrefixPostfixData(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: mockLanguage.current,
    },
    t: (key: string, options?: Record<string, string>) => {
      const table: Record<string, string> = {
        "common.back": "Back",
        "prefixPostfix.colExample": "EXAMPLE",
        "prefixPostfix.colMeaning": "MEANING",
        "prefixPostfix.colPostfix": "POSTFIX",
        "prefixPostfix.colPrefix": "PREFIX",
        "prefixPostfix.colPronun": "PRONUN",
        "prefixPostfix.empty": options?.defaultValue ?? "No prefix/postfix data found.",
        "prefixPostfix.loadError":
          options?.defaultValue ?? "Unable to load prefix/postfix data.",
        "prefixPostfix.loading": options?.defaultValue ?? "Loading...",
        "prefixPostfix.searchPlaceholder": "Search prefixes & postfixes...",
        "prefixPostfix.tabPostfix": "Postfix",
        "prefixPostfix.tabPrefix": "Prefix",
        "prefixPostfix.title": "Prefix & Postfix",
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("PrefixPostfixScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage.current = "en";
    mockGetPrefixPostfixData.mockResolvedValue({
      postfixes: [
        {
          id: "postfix-03",
          postfix: "-性",
          meaningEnglish: "nature / property / -ness",
          meaningKorean: "~성, 성질",
          pronunciation: "1. せい\n2. しょう",
          pronunciationRoman: "1. sei\n2. shō",
          example: "1. 安全性\n2. 可能性",
          exampleRoman: "1. anzensei\n2. kanōsei",
          translationEnglish: "1. safety\n2. possibility",
          translationKorean: "1. 안전성\n2. 가능성",
        },
      ],
      prefixes: [
        {
          id: "prefix-02",
          prefix: "無-",
          meaningEnglish: "absence / lack",
          meaningKorean: "없음·무",
          pronunciation: "1. む\n2. ぶ",
          pronunciationRoman: "1. mu\n2. bu",
          example: "1. 無料\n2. 無関係",
          exampleRoman: "1. muryō\n2. mukankei",
          translationEnglish: "1. free of charge\n2. unrelated",
          translationKorean: "1. 무료\n2. 무관계",
        },
      ],
    });
  });

  it("renders remotely loaded prefix data and switches to postfix data", async () => {
    const screen = render(<PrefixPostfixScreen />);

    await waitFor(() => {
      expect(screen.getByText("無-")).toBeTruthy();
      expect(screen.getByText("absence / lack")).toBeTruthy();
      expect(screen.getByText("1. 無料")).toBeTruthy();
      expect(screen.getByText("1. muryō")).toBeTruthy();
      expect(screen.getByText("1. free of charge")).toBeTruthy();
      expect(screen.getByText("2. 無関係")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Postfix"));

    await waitFor(() => {
      expect(screen.getByText("-性")).toBeTruthy();
      expect(screen.getByText("1. 安全性")).toBeTruthy();
      expect(screen.getByText("1. anzensei")).toBeTruthy();
      expect(screen.getByText("1. safety")).toBeTruthy();
      expect(screen.getByText("2. 可能性")).toBeTruthy();
    });
  });

  it("renders the meaning column in Korean when the current language is Korean", async () => {
    mockLanguage.current = "ko";
    const screen = render(<PrefixPostfixScreen />);

    await waitFor(() => {
      expect(screen.getByText("없음·무")).toBeTruthy();
    });

    expect(screen.queryByText("absence / lack")).toBeNull();
    expect(screen.getByText("1. 無料")).toBeTruthy();
    expect(screen.getByText("1. free of charge")).toBeTruthy();
  });

  it("filters loaded data using the search input", async () => {
    const screen = render(<PrefixPostfixScreen />);

    await waitFor(() => {
      expect(screen.getByText("無-")).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByPlaceholderText("Search prefixes & postfixes..."),
      "lack",
    );

    expect(screen.getByText("無-")).toBeTruthy();

    fireEvent.changeText(
      screen.getByPlaceholderText("Search prefixes & postfixes..."),
      "missing-result",
    );

    expect(screen.queryByText("無-")).toBeNull();
  });

  it("shows an error message instead of fallback content when the Firestore fetch fails", async () => {
    mockGetPrefixPostfixData.mockRejectedValueOnce(new Error("fetch failed"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const screen = render(<PrefixPostfixScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load prefix/postfix data."),
      ).toBeTruthy();
    });

    expect(screen.queryByText("無-")).toBeNull();
    warnSpy.mockRestore();
  });

  it("shows an empty state when Firestore returns no prefix/postfix entries", async () => {
    mockGetPrefixPostfixData.mockResolvedValueOnce({
      postfixes: [],
      prefixes: [],
    });

    const screen = render(<PrefixPostfixScreen />);

    await waitFor(() => {
      expect(screen.getByText("No prefix/postfix data found.")).toBeTruthy();
    });
  });

  it("falls back to raw multiline blocks when numbering is missing or mismatched", async () => {
    mockGetPrefixPostfixData.mockResolvedValueOnce({
      postfixes: [],
      prefixes: [
        {
          id: "prefix-bad",
          prefix: "御-",
          meaningEnglish: "polite",
          meaningKorean: "공손",
          pronunciation: "お / ご",
          pronunciationRoman: "o / go",
          example: "1. お名前\n2. ご案内",
          exampleRoman: "onamae",
          translationEnglish: "1. name\n2. guidance",
          translationKorean: "1. 이름\n2. 안내",
        },
      ],
    });

    const screen = render(<PrefixPostfixScreen />);

    await waitFor(() => {
      expect(screen.getByText("お / ご")).toBeTruthy();
      expect(screen.getByText("o / go")).toBeTruthy();
      expect(screen.getByText("1. お名前\n2. ご案内")).toBeTruthy();
      expect(screen.getByText("1. name\n2. guidance(1. 이름\n2. 안내)")).toBeTruthy();
    });
  });
});
