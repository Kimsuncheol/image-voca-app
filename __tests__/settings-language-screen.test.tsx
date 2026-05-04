import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import SettingsLanguageScreen from "../app/settings-language";

const mockSetLanguageMode = jest.fn();
const mockGetStudyReminderEnabledPreference = jest.fn();
const mockScheduleDailyNotifications = jest.fn();
const mockStackScreen = jest.fn();
let mockLanguageMode = "system";

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
    t: (key: string) =>
      ({
        "settings.language.title": "Language",
        "settings.language.systemDefault": "System Default",
        "settings.language.english": "English",
        "settings.language.englishUnitedStates": "English (United States)",
        "settings.language.englishUnitedKingdom": "English (United Kingdom)",
        "settings.language.korean": "Korean",
        "settings.language.japanese": "Japanese",
        "settings.language.spanish": "Spanish",
        "settings.language.french": "French",
        "settings.language.russian": "Russian",
        "settings.language.german": "German",
        "settings.language.italian": "Italian",
        "settings.language.hindi": "Hindi",
      })[key] ?? key,
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

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/i18n", () => ({
  setLanguageMode: (...args: any[]) => mockSetLanguageMode(...args),
}));

jest.mock("../src/stores/languageSettingsStore", () => ({
  useLanguageSettingsStore: (selector: any) =>
    selector({
      mode: mockLanguageMode,
    }),
}));

jest.mock("../src/utils/notifications", () => ({
  getStudyReminderEnabledPreference: (...args: any[]) =>
    mockGetStudyReminderEnabledPreference(...args),
  scheduleDailyNotifications: (...args: any[]) =>
    mockScheduleDailyNotifications(...args),
}));

describe("SettingsLanguageScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguageMode = "system";
    mockSetLanguageMode.mockResolvedValue(undefined);
    mockGetStudyReminderEnabledPreference.mockResolvedValue(false);
    mockScheduleDailyNotifications.mockResolvedValue(undefined);
  });

  it("renders the banner, display-language options, and selected checkmark", () => {
    const screen = render(<SettingsLanguageScreen />);

    expect(screen.getByTestId("top-banner-ad").props.children).toBe("false");
    expect(screen.getByText("System Default")).toBeTruthy();
    expect(screen.getByText("English (United States)")).toBeTruthy();
    expect(screen.getByText("English (United Kingdom)")).toBeTruthy();
    expect(screen.getByText("Korean")).toBeTruthy();
    expect(screen.getByText("Japanese")).toBeTruthy();
    expect(screen.getByText("Spanish")).toBeTruthy();
    expect(screen.getByText("French")).toBeTruthy();
    expect(screen.getByText("Russian")).toBeTruthy();
    expect(screen.getByText("German")).toBeTruthy();
    expect(screen.getByText("Italian")).toBeTruthy();
    expect(screen.getByText("Hindi")).toBeTruthy();
    expect(screen.getByText("🇺🇸")).toBeTruthy();
    expect(screen.getByText("🇬🇧")).toBeTruthy();
    expect(screen.getByText("🇰🇷")).toBeTruthy();
    expect(screen.getByText("🇯🇵")).toBeTruthy();
    expect(screen.getByText("🇪🇸")).toBeTruthy();
    expect(screen.getByText("🇫🇷")).toBeTruthy();
    expect(screen.getByText("🇷🇺")).toBeTruthy();
    expect(screen.getByText("🇩🇪")).toBeTruthy();
    expect(screen.getByText("🇮🇹")).toBeTruthy();
    expect(screen.getByText("🇮🇳")).toBeTruthy();
    expect(screen.getByTestId("icon-phone-portrait-outline")).toBeTruthy();
    expect(screen.queryByTestId("icon-language-outline")).toBeNull();
    expect(screen.getByTestId("settings-language-check-system")).toBeTruthy();

    const containerStyle = StyleSheet.flatten(
      screen.getByTestId("settings-language-screen").props.style,
    );
    const headerStyle = StyleSheet.flatten(
      mockStackScreen.mock.calls[0][0].options.headerStyle,
    );
    expect(headerStyle.backgroundColor).toBe(containerStyle.backgroundColor);
  });

  it("persists the selected display language", async () => {
    mockGetStudyReminderEnabledPreference.mockResolvedValue(true);
    const screen = render(<SettingsLanguageScreen />);

    fireEvent.press(screen.getByTestId("settings-language-option-en-GB"));

    await waitFor(() => {
      expect(mockSetLanguageMode).toHaveBeenCalledWith("en-GB");
    });
    expect(mockScheduleDailyNotifications).toHaveBeenCalled();
  });

  it("shows the selected checkmark for US English", () => {
    mockLanguageMode = "en-US";
    const screen = render(<SettingsLanguageScreen />);

    expect(screen.getByTestId("settings-language-check-en-US")).toBeTruthy();
  });

  it("shows the selected checkmark for UK English", () => {
    mockLanguageMode = "en-GB";
    const screen = render(<SettingsLanguageScreen />);

    expect(screen.getByTestId("settings-language-check-en-GB")).toBeTruthy();
  });
});
