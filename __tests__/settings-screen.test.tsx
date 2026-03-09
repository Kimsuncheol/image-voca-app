import { render } from "@testing-library/react-native";
import React from "react";
import SettingsScreen from "../app/(tabs)/settings";

const mockFetchSubscription = jest.fn();
const mockLoadDashboardSettings = jest.fn();

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
  cancelAllScheduledNotifications: jest.fn(),
  configureNotifications: jest.fn(),
  getNotificationPermissions: jest.fn().mockResolvedValue({ granted: false }),
  getNotificationsEnabledPreference: jest.fn().mockResolvedValue(false),
  getPopWordEnabledPreference: jest.fn().mockResolvedValue(false),
  getStudyReminderEnabledPreference: jest.fn().mockResolvedValue(false),
  isPermissionGranted: jest.fn().mockReturnValue(false),
  markStudyDate: jest.fn(),
  scheduleDailyNotifications: jest.fn(),
  setNotificationsEnabledPreference: jest.fn(),
  setPopWordEnabledPreference: jest.fn(),
  setStudyReminderEnabledPreference: jest.fn(),
}));

jest.mock("../components/course-wordbank/WordBankSettingsModal", () => ({
  WordBankSettingsModal: () => null,
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

jest.mock("../components/settings/NotificationsSection", () => ({
  NotificationsSection: () => null,
}));

jest.mock("../components/settings/SettingsHeader", () => ({
  SettingsHeader: () => null,
}));

jest.mock("../components/settings/SignOutSection", () => ({
  SignOutSection: () => null,
}));

jest.mock("../components/settings/DashboardSection", () => ({
  DashboardSection: () => null,
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render the target score study section", () => {
    const { queryByText } = render(<SettingsScreen />);

    expect(queryByText("Study Settings")).toBeNull();
    expect(queryByText("Target Score")).toBeNull();
  });
});
