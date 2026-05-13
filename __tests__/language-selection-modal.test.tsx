import AsyncStorage from "@react-native-async-storage/async-storage";
import { HeaderHeightContext } from "@react-navigation/elements";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { LanguageHeaderButton } from "../src/components/common/LanguageHeaderButton";
import { LanguageSelectionModal } from "../src/components/common/LanguageSelectionModal";
import {
  __resetJapaneseContentLanguageStoreForTests,
  JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD,
  useJapaneseContentLanguageStore,
} from "../src/stores/japaneseContentLanguageStore";

const mockSetLanguageMode = jest.fn();
const mockGetStudyReminderEnabledPreference = jest.fn();
const mockScheduleDailyNotifications = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn(
  async (_ref: unknown, _data: unknown, _options: unknown) => undefined,
);
let mockMode = "system";
let mockEffectiveLanguage = "en-US";
let mockIsDark = false;
let mockUser: { uid: string } | null = { uid: "user-1" };

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

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, collection: string, id: string) => `${collection}/${id}`),
  getDoc: (ref: unknown) => mockGetDoc(ref),
  setDoc: (ref: unknown, data: unknown, options: unknown) =>
    mockSetDoc(ref, data, options),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
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
    useJapaneseContentLanguageStore.setState({
      _initialized: true,
      _hydratedUserId: "user-1",
    });
    mockMode = "system";
    mockEffectiveLanguage = "en-US";
    mockIsDark = false;
    mockUser = { uid: "user-1" };
    mockSetLanguageMode.mockResolvedValue(undefined);
    mockGetStudyReminderEnabledPreference.mockResolvedValue(false);
    mockScheduleDailyNotifications.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
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

  it("falls back to default header height when context height is zero", () => {
    const screen = render(
      <HeaderHeightContext.Provider value={0}>
        <LanguageSelectionModal visible onClose={jest.fn()} />
      </HeaderHeightContext.Provider>,
    );

    const panel = screen.getByTestId("language-selection-modal-panel");
    const panelStyle = StyleSheet.flatten(panel.props.style);

    expect(panelStyle.top).toBe(48);
    expect(panelStyle.maxHeight).toBe(420);
  });

  it("does not paint a background behind the scroll content", () => {
    const screen = render(
      <LanguageSelectionModal visible onClose={jest.fn()} />,
    );

    const optionsCard = screen.getByTestId("language-selection-options-card");
    const cardStyle = StyleSheet.flatten(optionsCard.props.style);

    expect(cardStyle.backgroundColor).toBeUndefined();
  });

  it("changes UI language while preserving Japanese Korean content mode", async () => {
    mockGetStudyReminderEnabledPreference.mockResolvedValue(true);
    useJapaneseContentLanguageStore.setState({
      mode: "ko",
      _initialized: true,
      _hydratedUserId: "user-1",
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

  it("toggles Japanese Korean shortcut on and keeps UI language unchanged", async () => {
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
    expect(
      StyleSheet.flatten(
        screen.getByTestId("language-selection-japanese-korean-option").props
          .style,
      ).backgroundColor,
    ).toBe("transparent");

    fireEvent.press(
      screen.getByTestId("language-selection-japanese-korean-option"),
    );

    await waitFor(() => {
      expect(useJapaneseContentLanguageStore.getState().mode).toBe("ko");
    });
    expect(mockSetLanguageMode).not.toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledWith(
      "users/user-1",
      { [JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD]: "ko" },
      { merge: true },
    );
    expect(screen.getByTestId("language-selection-japanese-korean-check"))
      .toBeTruthy();
  });

  it("toggles Japanese Korean shortcut off and saves default remotely", async () => {
    useJapaneseContentLanguageStore.setState({
      mode: "ko",
      _initialized: true,
      _hydratedUserId: "user-1",
    });
    const screen = render(
      <LanguageSelectionModal
        visible
        onClose={jest.fn()}
        showJapaneseKoreanOption
      />,
    );

    expect(screen.getByTestId("language-selection-japanese-korean-check"))
      .toBeTruthy();
    expect(
      StyleSheet.flatten(
        screen.getByTestId("language-selection-japanese-korean-option").props
          .style,
      ),
    ).toEqual(
      expect.objectContaining({
        backgroundColor: "rgba(255,149,0,0.1)",
        borderColor: "rgba(255,149,0,0.35)",
      }),
    );

    fireEvent.press(
      screen.getByTestId("language-selection-japanese-korean-option"),
    );

    await waitFor(() => {
      expect(useJapaneseContentLanguageStore.getState().mode).toBe("default");
    });
    expect(mockSetDoc).toHaveBeenCalledWith(
      "users/user-1",
      { [JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD]: "default" },
      { merge: true },
    );
    expect(
      screen.queryByTestId("language-selection-japanese-korean-check"),
    ).toBeNull();
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
