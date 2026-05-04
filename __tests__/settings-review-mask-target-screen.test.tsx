import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import SettingsReviewMaskTargetScreen from "../app/settings-review-mask-target";
import type { ReviewMaskTarget } from "../src/services/speechPreferences";

const mockSetReviewMaskTarget = jest.fn();
const mockStackScreen = jest.fn();
let mockReviewMaskTarget: ReviewMaskTarget = "word-pronunciation";

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
        "settings.speech.reviewMaskTarget": "Mask target",
        "settings.speech.maskTargets.word-pronunciation": "Word",
        "settings.speech.maskTargets.meaning": "Meaning",
        "settings.speech.maskTargets.synonym": "Synonym",
        "settings.speech.maskTargets.all": "All",
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

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/hooks/useSpeechPreferences", () => ({
  useSpeechPreferences: () => ({
    vocabularyPreferences: {
      autoSpeakVocabulary: true,
      reviewMaskTarget: mockReviewMaskTarget,
    },
    setReviewMaskTarget: (...args: any[]) => mockSetReviewMaskTarget(...args),
  }),
}));

describe("SettingsReviewMaskTargetScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReviewMaskTarget = "word-pronunciation";
    mockSetReviewMaskTarget.mockResolvedValue({ persistedLocally: true });
  });

  it("renders the banner, mask target options, and selected checkmark", () => {
    const screen = render(<SettingsReviewMaskTargetScreen />);

    expect(screen.getByTestId("top-banner-ad").props.children).toBe("false");
    expect(screen.getByText("Word")).toBeTruthy();
    expect(screen.getByText("Meaning")).toBeTruthy();
    expect(screen.getByText("Synonym")).toBeTruthy();
    expect(screen.getByText("All")).toBeTruthy();
    expect(
      screen.getByTestId(
        "settings-review-mask-target-check-word-pronunciation",
      ),
    ).toBeTruthy();

    const containerStyle = StyleSheet.flatten(
      screen.getByTestId("settings-review-mask-target-screen").props.style,
    );
    const headerStyle = StyleSheet.flatten(
      mockStackScreen.mock.calls[0][0].options.headerStyle,
    );
    expect(headerStyle.backgroundColor).toBe(containerStyle.backgroundColor);
  });

  it("persists Word as the existing word-pronunciation target", async () => {
    const screen = render(<SettingsReviewMaskTargetScreen />);

    fireEvent.press(
      screen.getByTestId(
        "settings-review-mask-target-option-word-pronunciation",
      ),
    );

    await waitFor(() => {
      expect(mockSetReviewMaskTarget).toHaveBeenCalledWith(
        "word-pronunciation",
      );
    });
  });

  it("persists Meaning as the meaning target", async () => {
    const screen = render(<SettingsReviewMaskTargetScreen />);

    fireEvent.press(
      screen.getByTestId("settings-review-mask-target-option-meaning"),
    );

    await waitFor(() => {
      expect(mockSetReviewMaskTarget).toHaveBeenCalledWith("meaning");
    });
  });

  it("persists Synonym as the synonym target", async () => {
    const screen = render(<SettingsReviewMaskTargetScreen />);

    fireEvent.press(
      screen.getByTestId("settings-review-mask-target-option-synonym"),
    );

    await waitFor(() => {
      expect(mockSetReviewMaskTarget).toHaveBeenCalledWith("synonym");
    });
  });
});
