import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { LanguageHeaderButton } from "../src/components/common/LanguageHeaderButton";
import { LanguageSelectionModal } from "../src/components/common/LanguageSelectionModal";
import {
  __resetJapaneseContentLanguageStoreForTests,
  useJapaneseContentLanguageStore,
} from "../src/stores/japaneseContentLanguageStore";

const mockSetLanguageMode = jest.fn();
const mockGetStudyReminderEnabledPreference = jest.fn();
const mockScheduleDailyNotifications = jest.fn();
let mockMode = "system";
let mockEffectiveLanguage = "en-US";
let mockIsDark = false;

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const Ionicons = ({
    name,
    testID,
  }: {
    name: string;
    testID?: string;
  }) => <Text testID={testID ?? `icon-${name}`}>{name}</Text>;
  Ionicons.glyphMap = {};

  return { Ionicons };
});

jest.mock("@react-navigation/elements", () => {
  const React = require("react");

  return {
    HeaderHeightContext: React.createContext(undefined),
    getDefaultHeaderHeight: jest.fn(() => 56),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: mockIsDark,
  }),
}));

jest.mock("../src/stores/languageSettingsStore", () => ({
  useLanguageSettingsStore: (selector: any) =>
    selector({
      mode: mockMode,
      effectiveLanguage: mockEffectiveLanguage,
    }),
}));

jest.mock("../src/i18n", () => ({
  setLanguageMode: (...args: any[]) => mockSetLanguageMode(...args),
}));

jest.mock("../src/utils/notifications", () => ({
  getStudyReminderEnabledPreference: (...args: any[]) =>
    mockGetStudyReminderEnabledPreference(...args),
  scheduleDailyNotifications: (...args: any[]) =>
    mockScheduleDailyNotifications(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      ({
        "languageModal.title": "Language",
        "languageModal.headerButtonLabel": "Language options",
        "languageModal.learnJapaneseInKorean": "Learn Japanese in Korean",
        "languageModal.learnJapaneseInKoreanSubtitle":
          "Show Japanese course meanings in Korean.",
        "settings.language.systemDefault": "System Default",
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
      })[key] ??
      options?.defaultValue ??
      key,
  }),
}));

describe("LanguageSelectionModal", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    __resetJapaneseContentLanguageStoreForTests();
    useJapaneseContentLanguageStore.setState({ _initialized: true });
    mockMode = "system";
    mockEffectiveLanguage = "en-US";
    mockIsDark = false;
    mockSetLanguageMode.mockResolvedValue(undefined);
    mockGetStudyReminderEnabledPreference.mockResolvedValue(false);
    mockScheduleDailyNotifications.mockResolvedValue(undefined);
  });

  it("opens from the header button and closes on outside press", () => {
    const screen = render(<LanguageHeaderButton />);

    expect(screen.queryByText("Language")).toBeNull();

    fireEvent.press(screen.getByTestId("language-header-button"));

    expect(screen.getByText("Language")).toBeTruthy();

    fireEvent.press(screen.getByTestId("language-selection-modal-overlay"));

    expect(screen.queryByText("Language")).toBeNull();
  });

  it("renders the same language options as settings", () => {
    const screen = render(
      <LanguageSelectionModal visible onClose={jest.fn()} />,
    );

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
    expect(screen.getByTestId("language-selection-option-system-check"))
      .toBeTruthy();
  });

  it("changes UI language while preserving Japanese Korean content mode", async () => {
    mockGetStudyReminderEnabledPreference.mockResolvedValue(true);
    useJapaneseContentLanguageStore.setState({
      mode: "ko",
      _initialized: true,
    });
    const onClose = jest.fn();
    const screen = render(<LanguageSelectionModal visible onClose={onClose} />);

    fireEvent.press(screen.getByTestId("language-selection-option-en-GB"));

    await waitFor(() => {
    expect(mockSetLanguageMode).toHaveBeenCalledWith("en-GB");
    });
    expect(mockScheduleDailyNotifications).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(useJapaneseContentLanguageStore.getState().mode).toBe("ko");
  });

  it("shows Japanese Korean shortcut and keeps UI language unchanged", async () => {
    const screen = render(
      <LanguageSelectionModal
        visible
        onClose={jest.fn()}
        showJapaneseKoreanOption
      />,
    );

    expect(screen.getByText("Learn Japanese in Korean")).toBeTruthy();
    expect(
      screen.queryByTestId("language-selection-japanese-korean-check"),
    ).toBeNull();

    fireEvent.press(
      screen.getByTestId("language-selection-japanese-korean-option"),
    );

    await waitFor(() => {
      expect(useJapaneseContentLanguageStore.getState().mode).toBe("ko");
    });
    expect(mockSetLanguageMode).not.toHaveBeenCalled();
    expect(screen.getByTestId("language-selection-japanese-korean-check"))
      .toBeTruthy();
  });

  it("hides the Japanese Korean shortcut when not requested", () => {
    const screen = render(
      <LanguageSelectionModal visible onClose={jest.fn()} />,
    );

    expect(
      screen.queryByTestId("language-selection-japanese-korean-option"),
    ).toBeNull();
  });
});
