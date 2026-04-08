import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import CountersScreen from "../app/counters";

const mockPush = jest.fn();
const mockLanguage = { current: "en" };

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>{name}</Text>;
  },
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
    i18n: {
      language: mockLanguage.current,
    },
    t: (key: string, options?: { defaultValue?: string }) => {
      const table: Record<string, string> = {
        "common.back": "Back",
        "counters.title": "Counters",
        "counters.subtitle":
          "Browse essential Japanese counter groups and open the one you need in a tap.",
        "counters.gridLabel": "Counter groups",
        "elementaryJapanese.title": "Elementary Japanese",
        "counters.tabs.numbers": "Numbers",
        "counters.tabs.counter_tsuu": "Tsuu",
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("CountersScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage.current = "en";
  });

  it("renders the modern counters hero and grid menu without the table/list", () => {
    const screen = render(<CountersScreen />);

    expect(screen.getByText("Elementary Japanese")).toBeTruthy();
    expect(
      screen.getByText(
        "Browse essential Japanese counter groups and open the one you need in a tap.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Counter groups")).toBeTruthy();
    expect(screen.getByText("Numbers")).toBeTruthy();
    expect(screen.getByText("Tsuu")).toBeTruthy();
    expect(screen.queryByText("COUNTER")).toBeNull();
    expect(screen.queryByText("MEANING")).toBeNull();
  });

  it("navigates to the category screen when a tile is tapped", () => {
    const screen = render(<CountersScreen />);

    fireEvent.press(screen.getByText("Tsuu"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/counter-category",
      params: {
        tab: "counter_tsuu",
      },
    });
  });
});
