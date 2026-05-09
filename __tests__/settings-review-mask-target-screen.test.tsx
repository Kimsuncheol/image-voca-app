import {
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import SettingsReviewMaskTargetScreen from "../app/settings-review-mask-target";
import type { ReviewMaskTarget } from "../src/services/speechPreferences";

const mockSetReviewMaskTarget = jest.fn();
const mockStackScreen = jest.fn();
let mockReviewMaskTarget: ReviewMaskTarget = "word";
let mockLearningLanguage = "en";

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
        "settings.speech.maskTargetSections.common": "Common",
        "settings.speech.maskTargetSections.reading": "Reading section",
        "settings.speech.maskTargetSections.synonym": "Synonym section",
        "settings.speech.maskTargets.word": "Word",
        "settings.speech.maskTargets.meaning": "Meaning",
        "settings.speech.maskTargets.reading": "Reading",
        "settings.speech.maskTargets.example": "Example",
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

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: mockLearningLanguage,
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
    mockReviewMaskTarget = "word";
    mockLearningLanguage = "en";
    mockSetReviewMaskTarget.mockResolvedValue({ persistedLocally: true });
  });

  it("renders English mask target sections with Synonym in Common", () => {
    const screen = render(<SettingsReviewMaskTargetScreen />);

    expect(screen.getByTestId("top-banner-ad").props.children).toBe("false");
    const commonSection = screen.getByTestId(
      "settings-review-mask-target-section-common",
    );

    expect(screen.getByText("Common")).toBeTruthy();
    expect(screen.queryByTestId("settings-review-mask-target-section-reading"))
      .toBeNull();
    expect(screen.queryByTestId("settings-review-mask-target-section-synonym"))
      .toBeNull();
    expect(screen.queryByText("Synonym section")).toBeNull();
    expect(
      within(commonSection).getByTestId("settings-review-mask-target-option-word"),
    ).toBeTruthy();
    expect(
      within(commonSection).getByTestId(
        "settings-review-mask-target-option-meaning",
      ),
    ).toBeTruthy();
    expect(
      within(commonSection).getByTestId(
        "settings-review-mask-target-option-example",
      ),
    ).toBeTruthy();
    expect(
      within(commonSection).getByTestId(
        "settings-review-mask-target-option-synonym",
      ),
    ).toBeTruthy();
    expect(
      within(commonSection).getByTestId("settings-review-mask-target-option-all"),
    ).toBeTruthy();
    expect(screen.queryByText("Reading")).toBeNull();
    expect(
      screen.getByTestId("settings-review-mask-target-check-word"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId(
        "settings-review-mask-target-option-word-pronunciation",
      ),
    ).toBeNull();

    const containerStyle = StyleSheet.flatten(
      screen.getByTestId("settings-review-mask-target-screen").props.style,
    );
    const headerStyle = StyleSheet.flatten(
      mockStackScreen.mock.calls[0][0].options.headerStyle,
    );
    expect(headerStyle.backgroundColor).toBe(containerStyle.backgroundColor);
  });

  it("renders Reading section only for Japanese learning language", () => {
    mockLearningLanguage = "ja";

    const screen = render(<SettingsReviewMaskTargetScreen />);

    expect(
      screen.getByTestId("settings-review-mask-target-section-common"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("settings-review-mask-target-section-reading"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("settings-review-mask-target-section-synonym"),
    ).toBeTruthy();
    expect(screen.getByText("Reading")).toBeTruthy();
    expect(
      screen.getByTestId("settings-review-mask-target-option-reading"),
    ).toBeTruthy();
  });

  it("places Common, Reading, and Synonym options in separate sections", () => {
    mockLearningLanguage = "ja";

    const screen = render(<SettingsReviewMaskTargetScreen />);

    const commonSection = screen.getByTestId(
      "settings-review-mask-target-section-common",
    );
    const readingSection = screen.getByTestId(
      "settings-review-mask-target-section-reading",
    );
    const synonymSection = screen.getByTestId(
      "settings-review-mask-target-section-synonym",
    );

    expect(
      within(commonSection).getByTestId("settings-review-mask-target-option-word"),
    ).toBeTruthy();
    expect(
      within(commonSection).getByTestId(
        "settings-review-mask-target-option-meaning",
      ),
    ).toBeTruthy();
    expect(
      within(commonSection).getByTestId(
        "settings-review-mask-target-option-example",
      ),
    ).toBeTruthy();
    expect(
      within(commonSection).getByTestId("settings-review-mask-target-option-all"),
    ).toBeTruthy();
    expect(
      within(commonSection).queryByTestId(
        "settings-review-mask-target-option-reading",
      ),
    ).toBeNull();
    expect(
      within(commonSection).queryByTestId(
        "settings-review-mask-target-option-synonym",
      ),
    ).toBeNull();
    expect(
      within(readingSection).getByTestId(
        "settings-review-mask-target-option-reading",
      ),
    ).toBeTruthy();
    expect(
      within(synonymSection).getByTestId(
        "settings-review-mask-target-option-synonym",
      ),
    ).toBeTruthy();
  });

  it("normalizes persisted Reading to Word in English mode", async () => {
    mockReviewMaskTarget = "reading";

    render(<SettingsReviewMaskTargetScreen />);

    await waitFor(() => {
      expect(mockSetReviewMaskTarget).toHaveBeenCalledWith("word");
    });
  });

  it("persists Word as the word target", async () => {
    const screen = render(<SettingsReviewMaskTargetScreen />);

    fireEvent.press(
      screen.getByTestId("settings-review-mask-target-option-word"),
    );

    await waitFor(() => {
      expect(mockSetReviewMaskTarget).toHaveBeenCalledWith("word");
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

  it("persists Reading as the reading target", async () => {
    mockLearningLanguage = "ja";
    const screen = render(<SettingsReviewMaskTargetScreen />);

    fireEvent.press(
      screen.getByTestId("settings-review-mask-target-option-reading"),
    );

    await waitFor(() => {
      expect(mockSetReviewMaskTarget).toHaveBeenCalledWith("reading");
    });
  });

  it("persists Example as the example target", async () => {
    const screen = render(<SettingsReviewMaskTargetScreen />);

    fireEvent.press(
      screen.getByTestId("settings-review-mask-target-option-example"),
    );

    await waitFor(() => {
      expect(mockSetReviewMaskTarget).toHaveBeenCalledWith("example");
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
