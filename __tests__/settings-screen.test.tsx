import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import SettingsScreen from "../app/(tabs)/settings";

const mockFetchSubscription = jest.fn();
const mockLoadDashboardSettings = jest.fn();
const mockConfigureNotifications = jest.fn();
const mockSetStudyReminderEnabledPreference = jest.fn();
const mockCancelAllScheduledNotifications = jest.fn();
const mockScheduleDailyNotifications = jest.fn();
const mockIsPermissionGranted = jest.fn();
const mockMarkStudyDate = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn(),
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
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

jest.mock("../src/i18n", () => ({
  setLanguage: jest.fn(),
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
  LanguageSection: () => null,
}));

jest.mock("../components/settings/LearningLanguageSection", () => ({
  LearningLanguageSection: () => null,
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
  SpeechSection: () => null,
}));

jest.mock("../components/settings/DashboardSection", () => ({
  DashboardSection: () => null,
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigureNotifications.mockResolvedValue({ granted: true });
    mockIsPermissionGranted.mockReturnValue(true);
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
