import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import SettingsScreen from "../app/(tabs)/settings";
import {
  __resetReadingDisplayStoreForTests,
  useReadingDisplayStore,
} from "../src/stores/readingDisplayStore";

const mockFetchSubscription = jest.fn();
const mockLoadDashboardSettings = jest.fn();
const mockConfigureNotifications = jest.fn();
const mockSetStudyReminderEnabledPreference = jest.fn();
const mockCancelAllScheduledNotifications = jest.fn();
const mockScheduleDailyNotifications = jest.fn();
const mockIsPermissionGranted = jest.fn();
const mockMarkStudyDate = jest.fn();
const mockRouterPush = jest.fn();

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
    Screen: () => null,
  },
  useFocusEffect: jest.fn(),
  useRouter: () => ({
    replace: jest.fn(),
    push: mockRouterPush,
    back: jest.fn(),
  }),
}));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      ({
        "settings.language.learningLanguage": "Learning language",
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
        "settings.speech.title": "Speech & Mask",
        "settings.speech.speed": "Speech speed",
        "settings.speech.normal": "Normal",
        "settings.speech.autoVocabularySpeech": "Auto speech",
        "settings.speech.reviewMaskTarget": "Mask target",
        "settings.speech.maskTargets.word-pronunciation": "Word",
        "settings.eyeComfort.title": "Eye Comfort",
        "settings.eyeComfort.toggleLabel": "Eye comfort mode",
        "settings.eyeComfort.description":
          "Adds a gentle warm tint to reduce blue light while studying",
        "settings.eyeComfort.intensity": "Intensity",
        "settings.eyeComfort.levels.medium": "Medium",
        "settings.eyeComfort.levels.custom": "Customize",
      })[key] ??
      options?.defaultValue ??
      key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "user-1" } }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
    isDark: false,
  }),
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: "en",
    setLearningLanguage: jest.fn(),
  }),
}));

jest.mock("../src/hooks/useSpeechPreferences", () => ({
  useSpeechPreferences: () => ({
    getPreset: () => "normal",
    setPreset: jest.fn().mockResolvedValue({ persistedLocally: true }),
    vocabularyPreferences: {
      autoSpeakVocabulary: true,
      reviewMaskTarget: "word-pronunciation",
    },
    setAutoSpeakVocabulary: jest
      .fn()
      .mockResolvedValue({ persistedLocally: true }),
  }),
}));

jest.mock("../src/i18n", () => ({
  setLanguageMode: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  auth: {},
}));

jest.mock("../src/stores", () => ({
  useSubscriptionStore: () => ({
    fetchSubscription: mockFetchSubscription,
  }),
  useUserStatsStore: () => ({
    fetchStats: jest.fn(),
  }),
}));

jest.mock("../src/stores/dashboardSettingsStore", () => ({
  useDashboardSettingsStore: () => ({
    loadSettings: mockLoadDashboardSettings,
  }),
}));

jest.mock("../src/stores/languageSettingsStore", () => ({
  useLanguageSettingsStore: (selector: any) =>
    selector({
      mode: "system",
      effectiveLanguage: "en-US",
    }),
}));

jest.mock("../src/utils/notifications", () => ({
  cancelAllScheduledNotifications: (...args: any[]) =>
    mockCancelAllScheduledNotifications(...args),
  configureNotifications: (...args: any[]) => mockConfigureNotifications(...args),
  getNotificationPermissions: jest.fn().mockResolvedValue({ granted: false }),
  getStudyReminderEnabledPreference: jest.fn().mockResolvedValue(false),
  isPermissionGranted: (...args: any[]) => mockIsPermissionGranted(...args),
  markStudyDate: (...args: any[]) => mockMarkStudyDate(...args),
  scheduleDailyNotifications: (...args: any[]) =>
    mockScheduleDailyNotifications(...args),
  setStudyReminderEnabledPreference: (...args: any[]) =>
    mockSetStudyReminderEnabledPreference(...args),
}));

jest.mock("../components/settings/AccountSection", () => ({
  AccountSection: () => null,
}));

jest.mock("../components/settings/AppearanceSection", () => ({
  AppearanceSection: () => null,
}));

jest.mock("../components/settings/LanguageSection", () => ({
  ...jest.requireActual("../components/settings/LanguageSection"),
}));

jest.mock("../components/settings/LearningLanguageSection", () => ({
  ...jest.requireActual("../components/settings/LearningLanguageSection"),
}));

jest.mock("../components/settings/NotificationsSection", () => ({
  NotificationsSection: (props: any) => {
    const ReactNative = require("react-native");

    return (
      <ReactNative.View>
        <ReactNative.Text testID="study-enabled">
          {String(props.studyReminderEnabled)}
        </ReactNative.Text>
        <ReactNative.Pressable
          testID="toggle-study-off"
          onPress={() => props.onToggleStudyReminder(false)}
        />
        <ReactNative.Pressable
          testID="toggle-study-on"
          onPress={() => props.onToggleStudyReminder(true)}
        />
      </ReactNative.View>
    );
  },
}));

jest.mock("../components/settings/SettingsHeader", () => ({
  SettingsHeader: () => null,
}));

jest.mock("../components/settings/SignOutSection", () => ({
  SignOutSection: () => null,
}));

jest.mock("../components/settings/SpeechSection", () => ({
  ...jest.requireActual("../components/settings/SpeechSection"),
}));

jest.mock("../components/settings/DashboardSection", () => ({
  DashboardSection: () => null,
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetReadingDisplayStoreForTests();
    useReadingDisplayStore.setState({ _initialized: true });
    mockConfigureNotifications.mockResolvedValue({ granted: true });
    mockIsPermissionGranted.mockReturnValue(true);
  });

  it("renders the display-language row that opens the language detail screen", () => {
    const screen = render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("settings-language-row"));

    expect(mockRouterPush).toHaveBeenCalledWith("/settings-language");
  });

  it("renders the learning-language row that opens its detail screen", () => {
    const screen = render(<SettingsScreen />);

    expect(screen.getAllByText("Learning language").length).toBeGreaterThan(0);
    expect(screen.queryByText("The language you wish to learn")).toBeNull();
    expect(
      screen.queryByTestId("settings-learning-language-option-ja"),
    ).toBeNull();

    fireEvent.press(screen.getByTestId("settings-learning-language-row"));

    expect(mockRouterPush).toHaveBeenCalledWith("/settings-learning-language");
  });

  it("renders the review-mask-target row that opens its detail screen", async () => {
    const screen = render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-review-mask-target-row")).toBeTruthy();
    });

    expect(screen.queryByTestId("review-mask-target-selector")).toBeNull();

    fireEvent.press(screen.getByTestId("settings-review-mask-target-row"));

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/settings-review-mask-target",
    );
  });

  it("renders the speech-speed row that opens its detail screen", async () => {
    const screen = render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-speech-speed-row")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("settings-speech-speed-row"));

    expect(mockRouterPush).toHaveBeenCalledWith("/settings-speech-speed");
  });

  it("renders eye comfort summary and hides intensity while disabled", () => {
    const screen = render(<SettingsScreen />);

    expect(screen.getByText("Eye Comfort")).toBeTruthy();
    expect(screen.getByText("Eye comfort mode")).toBeTruthy();
    expect(screen.getByText(
      "Adds a gentle warm tint to reduce blue light while studying",
    )).toBeTruthy();
    expect(screen.getByTestId("icon-eye-outline")).toBeTruthy();
    expect(screen.getByTestId("eye-comfort-description")).toBeTruthy();
    expect(screen.queryByTestId("eye-comfort-intensity-row")).toBeNull();
  });

  it("shows and opens the eye comfort intensity row when enabled", () => {
    useReadingDisplayStore.setState({
      eyeComfortEnabled: true,
      eyeComfortIntensity: 0.14,
      _initialized: true,
    });
    const screen = render(<SettingsScreen />);

    expect(screen.getByTestId("eye-comfort-intensity-row")).toBeTruthy();
    expect(screen.getByText("Intensity")).toBeTruthy();
    expect(screen.getByText("Medium")).toBeTruthy();

    fireEvent.press(screen.getByTestId("eye-comfort-intensity-row"));

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/settings/eye-comfort-intensity",
    );
  });

  it("shows customize as the current eye comfort intensity", () => {
    useReadingDisplayStore.setState({
      eyeComfortEnabled: true,
      eyeComfortIntensity: 0.25,
      _initialized: true,
    });
    const screen = render(<SettingsScreen />);

    expect(screen.getByTestId("eye-comfort-intensity-row")).toBeTruthy();
    expect(screen.getByText("Customize")).toBeTruthy();
  });

  it("orders learning language, display language, then speech and mask", () => {
    const screen = render(<SettingsScreen />);
    const root = screen.toJSON();
    const orderedTestIds: string[] = [];

    const collectTestIds = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (node.props?.testID) {
        orderedTestIds.push(node.props.testID);
      }
      const children = Array.isArray(node.children)
        ? node.children
        : node.children
          ? [node.children]
          : [];

      children.forEach(collectTestIds);
    };

    collectTestIds(root);

    const learningIndex = orderedTestIds.indexOf("settings-learning-language-row");
    const languageIndex = orderedTestIds.indexOf("settings-language-row");
    const speechIndex = orderedTestIds.indexOf("settings-speech-speed-row");

    expect(learningIndex).toBeGreaterThanOrEqual(0);
    expect(languageIndex).toBeGreaterThan(learningIndex);
    expect(speechIndex).toBeGreaterThan(languageIndex);
  });

  it("does not render the target score study section", () => {
    const { queryByText } = render(<SettingsScreen />);

    expect(queryByText("Study Settings")).toBeNull();
    expect(queryByText("Target Score")).toBeNull();
  });

  it("does not render the removed word bank display section", () => {
    const { queryByText } = render(<SettingsScreen />);

    expect(queryByText("Word Bank")).toBeNull();
    expect(queryByText("Card Display")).toBeNull();
  });

  it("turning study reminders off disables reminders and cancels scheduled notifications", async () => {
    const screen = render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("toggle-study-off"));

    await waitFor(() => {
      expect(screen.getByTestId("study-enabled").props.children).toBe("false");
    });

    expect(mockSetStudyReminderEnabledPreference).toHaveBeenCalledWith(false);
    expect(mockCancelAllScheduledNotifications).toHaveBeenCalled();
  });

  it("turning study reminders on requests permission and schedules reminders", async () => {
    const screen = render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("toggle-study-on"));

    await waitFor(() => {
      expect(screen.getByTestId("study-enabled").props.children).toBe("true");
    });

    expect(mockConfigureNotifications).toHaveBeenCalled();
    expect(mockMarkStudyDate).toHaveBeenCalled();
    expect(mockSetStudyReminderEnabledPreference).toHaveBeenCalledWith(true);
    expect(mockScheduleDailyNotifications).toHaveBeenCalledWith();
  });
});
