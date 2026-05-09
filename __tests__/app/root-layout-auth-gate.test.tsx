import { render, waitFor } from "@testing-library/react-native";
import { useRouter, useSegments } from "expo-router";
import React from "react";
import { Text as MockText } from "react-native";
import { RootLayoutNav } from "../../app/_layout";

const mockReplace = jest.fn();
const mockUseAuth = jest.fn();
const mockStackScreens: { name?: string; options?: any }[] = [];

jest.mock("expo-router", () => {
  const Stack = (({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )) as React.FC<{ children: React.ReactNode }> & {
    Screen: React.FC;
  };
  Stack.displayName = "MockStack";
  Stack.Screen = (props: {
    name?: string;
    options?: { headerRight?: () => React.ReactNode };
  }) => {
    mockStackScreens.push(props);
    const HeaderRight = props.options?.headerRight;
    return HeaderRight ? <HeaderRight /> : null;
  };
  Stack.Screen.displayName = "MockStackScreen";
  return {
    Stack,
    useRouter: jest.fn(),
    useSegments: jest.fn(),
  };
});

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("@react-navigation/native", () => ({
  DarkTheme: {},
  DefaultTheme: {},
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-paper", () => ({
  MD3DarkTheme: { colors: {} },
  MD3LightTheme: { colors: {} },
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
  AppThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../src/context/LearningLanguageContext", () => ({
  LearningLanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  useLearningLanguage: () => ({
    isReady: true,
    learningLanguage: "en",
    recentCourseByLanguage: {},
  }),
  RECENT_COURSE_STORAGE_KEY: "recent-course",
}));

jest.mock("../../src/hooks/useAuthenticatedDeviceRegistration", () => ({
  useAuthenticatedDeviceRegistration: jest.fn(),
}));

jest.mock("../../src/hooks/useStudyReminderNotifications", () => ({
  useStudyReminderNotifications: jest.fn(),
}));

jest.mock("../../src/hooks/useDeviceDeletionEnforcement", () => ({
  useDeviceDeletionEnforcement: jest.fn(),
}));

jest.mock("../../src/i18n", () => ({
  hydrateLanguage: jest.fn().mockResolvedValue(undefined),
  syncLanguageWithSystemLocales: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-localization", () => ({
  useLocales: () => [
    { languageTag: "en-US", languageCode: "en", regionCode: "US" },
  ],
}));

jest.mock("../../src/services/vocabularyPrefetch", () => ({
  fetchVocabularyCards: jest.fn().mockResolvedValue([]),
  hydrateVocabularyCache: jest.fn().mockResolvedValue([]),
  isVocabularyCacheFresh: jest.fn().mockReturnValue(true),
}));

jest.mock("../../components/common/AppSplashScreen", () => ({
  AppSplashScreen: () => null,
}));

jest.mock("../../components/common/NetworkStatusBanner", () => ({
  NetworkStatusBanner: () => null,
}));

jest.mock("../../components/common/NetworkErrorOverlay", () => ({
  NetworkErrorOverlay: () => null,
}));

jest.mock("../../src/components/common/LanguageHeaderButton", () => ({
  LanguageHeaderButton: ({
    showJapaneseKoreanOption,
  }: {
    showJapaneseKoreanOption?: boolean;
  }) => {
    return (
      <MockText testID="language-header-button">
        {showJapaneseKoreanOption ? "japanese-korean-enabled" : "default"}
      </MockText>
    );
  },
}));

jest.mock("../../src/components/common/EyeComfortHeaderButton", () => ({
  EyeComfortHeaderButton: () => (
    <MockText testID="eye-comfort-header-button">Aa</MockText>
  ),
}));

jest.mock("../../src/components/common/ReadingDisplayModal", () => ({
  ReadingDisplayModal: () => null,
}));

jest.mock("../../src/components/common/EyeComfortOverlay", () => ({
  EyeComfortOverlay: () => null,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("RootLayoutNav auth gating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStackScreens.length = 0;
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it("renders language and reading display triggers in the courses native header", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    (useSegments as jest.Mock).mockReturnValue(["courses"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.getByTestId("language-header-button").props.children).toBe(
      "japanese-korean-enabled",
    );
    expect(screen.getByTestId("eye-comfort-header-button")).toBeTruthy();
    const coursesScreen = mockStackScreens.find(
      (stackScreen) => stackScreen.name === "courses",
    );
    expect(coursesScreen?.options?.headerRight).toBeTruthy();
    expect(coursesScreen?.options?.headerTintColor).toBe("#000");
  });

  it("redirects signed-out users away from app routes", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      authStatus: "signed_out",
    });
    (useSegments as jest.Mock).mockReturnValue(["(tabs)"]);

    render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  it("redirects pending-verification users to the verify-email screen", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "pending_verification",
    });
    (useSegments as jest.Mock).mockReturnValue(["(tabs)"]);

    render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/verify-email");
    });
  });

  it("redirects fully signed-in users out of auth routes", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-2" },
      loading: false,
      authStatus: "signed_in",
    });
    (useSegments as jest.Mock).mockReturnValue(["(auth)", "login"]);

    render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });
});
