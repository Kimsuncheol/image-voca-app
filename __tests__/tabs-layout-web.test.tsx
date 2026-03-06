import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import AppTabScaffoldWeb from "../components/navigation/AppTabScaffold.web";
import { useTabLayout } from "../src/context/TabLayoutContext";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../components/ui/icon-symbol", () => ({
  IconSymbol: () => null,
}));

jest.mock("../app/(tabs)/wordbank", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: () => <Text>Word Bank Screen</Text>,
  };
});

jest.mock("../app/(tabs)/swipe", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: () => <Text>Voca Screen</Text>,
  };
});

jest.mock("../app/(tabs)/settings", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: () => <Text>Settings Screen</Text>,
  };
});

jest.mock("../app/(tabs)/index", () => {
  const React = require("react");
  const { Text, TouchableOpacity, View } = require("react-native");
  const { useTabLayout } = require("../src/context/TabLayoutContext");

  const MockDashboardScreen = () => {
    const tabLayout = useTabLayout();

    return (
      <View>
        <Text>Dashboard Screen</Text>
        <TouchableOpacity onPress={() => tabLayout?.goToTab("settings")}>
          <Text>Go to settings from context</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return {
    __esModule: true,
    default: MockDashboardScreen,
  };
});

describe("TabLayoutWeb", () => {
  test("switches tabs from the bottom bar and from TabLayoutContext", () => {
    const screen = render(<AppTabScaffoldWeb />);

    expect(screen.getByText("Dashboard Screen")).toBeTruthy();

    fireEvent.press(screen.getByText("tabs.wordBank"));
    expect(screen.getByText("Word Bank Screen")).toBeTruthy();

    fireEvent.press(screen.getByText("tabs.dashboard"));
    fireEvent.press(screen.getByText("Go to settings from context"));
    expect(screen.getByText("Settings Screen")).toBeTruthy();
  });
});
