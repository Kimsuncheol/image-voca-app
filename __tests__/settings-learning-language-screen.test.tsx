import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import SettingsLearningLanguageScreen from "../app/settings-learning-language";
import type { LearningLanguage } from "../src/types/vocabulary";

const mockSetLearningLanguage = jest.fn();
const mockStackScreen = jest.fn();
let mockLearningLanguage: LearningLanguage = "en";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const Ionicons = ({ name, testID }: { name: string; testID?: string }) => (
    <Text testID={testID ?? `icon-${name}`}>{name}</Text>
  );
  Ionicons.glyphMap = {};

  return { Ionicons };
});

jest.mock("expo-router", () => ({
  Stack: {
    Screen: (props: any) => {
      mockStackScreen(props);
      return null;
    },
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      ({
        "settings.language.learningLanguage": "Learning language",
        "settings.language.wishToLearn": "The language you wish to learn",
        "settings.language.english": "English",
        "settings.language.japanese": "Japanese",
      })[key] ??
      options?.defaultValue ??
      key,
  }),
}));

jest.mock("../components/ads/TopBannerAd", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    TopBannerAd: ({ includeTopInset }: { includeTopInset: boolean }) => (
      <Text testID="top-banner-ad">{String(includeTopInset)}</Text>
    ),
  };
});

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: mockLearningLanguage,
    setLearningLanguage: (...args: any[]) => mockSetLearningLanguage(...args),
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

describe("SettingsLearningLanguageScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLearningLanguage = "en";
    mockSetLearningLanguage.mockResolvedValue(undefined);
  });

  it("renders the banner, options, selected checkmark, and matching header background", () => {
    const screen = render(<SettingsLearningLanguageScreen />);

    expect(screen.getByTestId("top-banner-ad").props.children).toBe("false");
    expect(screen.getByText("Learning language")).toBeTruthy();
    expect(mockStackScreen.mock.calls[0][0].options.title).toBe(
      "Learning language",
    );
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText("Japanese")).toBeTruthy();
    expect(screen.getByText("🇺🇸")).toBeTruthy();
    expect(screen.getByText("🇯🇵")).toBeTruthy();
    expect(screen.queryByTestId("icon-globe-outline")).toBeNull();
    expect(screen.queryByText("The language you wish to learn")).toBeNull();
    expect(screen.getByTestId("settings-learning-language-check-en")).toBeTruthy();

    const containerStyle = StyleSheet.flatten(
      screen.getByTestId("settings-learning-language-screen").props.style,
    );
    const headerStyle = StyleSheet.flatten(
      mockStackScreen.mock.calls[0][0].options.headerStyle,
    );
    expect(headerStyle.backgroundColor).toBe(containerStyle.backgroundColor);
  });

  it("persists the selected learning language", async () => {
    const screen = render(<SettingsLearningLanguageScreen />);

    fireEvent.press(screen.getByTestId("settings-learning-language-option-ja"));

    await waitFor(() => {
      expect(mockSetLearningLanguage).toHaveBeenCalledWith("ja");
    });
  });
});
