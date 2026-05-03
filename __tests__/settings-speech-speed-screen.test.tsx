import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert, StyleSheet } from "react-native";

import SettingsSpeechSpeedScreen from "../app/settings-speech-speed";
import type {
  SpeechPreferenceLanguage,
  SpeechSpeedPreset,
} from "../src/services/speechPreferences";

const mockSetPreset = jest.fn();
const mockStackScreen = jest.fn();
let mockLearningLanguage = "en";
let mockPreset: SpeechSpeedPreset = "normal";

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
        "settings.speech.speed": "Speech speed",
        "settings.speech.slow": "Slow",
        "settings.speech.normal": "Normal",
        "settings.speech.fast": "Fast",
        "settings.speech.saveFailed": "Could not save.",
        "common.error": "Error",
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

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: mockLearningLanguage,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/hooks/useSpeechPreferences", () => ({
  useSpeechPreferences: () => ({
    getPreset: (_language: SpeechPreferenceLanguage) => mockPreset,
    setPreset: (...args: any[]) => mockSetPreset(...args),
  }),
}));

describe("SettingsSpeechSpeedScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLearningLanguage = "en";
    mockPreset = "normal";
    mockSetPreset.mockResolvedValue({ persistedLocally: true });
  });

  it("renders the banner, speed options, selected checkmark, and matching header background", () => {
    const screen = render(<SettingsSpeechSpeedScreen />);

    expect(screen.getByTestId("top-banner-ad").props.children).toBe("false");
    expect(screen.getByText("Slow")).toBeTruthy();
    expect(screen.getAllByText("Normal")).toHaveLength(1);
    expect(screen.getByText("Fast")).toBeTruthy();
    expect(screen.getByTestId("settings-speech-speed-check-normal")).toBeTruthy();

    const containerStyle = StyleSheet.flatten(
      screen.getByTestId("settings-speech-speed-screen").props.style,
    );
    const headerStyle = StyleSheet.flatten(
      mockStackScreen.mock.calls[0][0].options.headerStyle,
    );
    expect(headerStyle.backgroundColor).toBe(containerStyle.backgroundColor);
  });

  it("persists Fast for English learners", async () => {
    const screen = render(<SettingsSpeechSpeedScreen />);

    fireEvent.press(screen.getByTestId("settings-speech-speed-option-fast"));

    await waitFor(() => {
      expect(mockSetPreset).toHaveBeenCalledWith("en", "fast");
    });
  });

  it("persists the selected preset for Japanese learners", async () => {
    mockLearningLanguage = "ja";
    const screen = render(<SettingsSpeechSpeedScreen />);

    fireEvent.press(screen.getByTestId("settings-speech-speed-option-slow"));

    await waitFor(() => {
      expect(mockSetPreset).toHaveBeenCalledWith("ja", "slow");
    });
  });

  it("shows an alert when local persistence fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockSetPreset.mockResolvedValueOnce({ persistedLocally: false });
    const screen = render(<SettingsSpeechSpeedScreen />);

    fireEvent.press(screen.getByTestId("settings-speech-speed-option-fast"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "Could not save.");
    });

    alertSpy.mockRestore();
  });
});
