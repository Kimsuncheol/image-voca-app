import { render, waitFor } from "@testing-library/react-native";
import { useRouter, useSegments } from "expo-router";
import React from "react";
import { RootLayoutNav } from "../../app/_layout";

const mockReplace = jest.fn();
const mockFetchSubscription = jest.fn();
const mockResetSubscription = jest.fn();
const mockUseAuth = jest.fn();
const mockSetTutorialStatus = jest.fn();
const mockResetTutorialStatus = jest.fn();
const mockGetHasCompletedTutorial = jest.fn();
let mockTutorialStatus = "idle";

jest.mock("expo-router", () => {
  const Stack = ({ children }: { children: React.ReactNode }) => children;
  Stack.displayName = "MockStack";
  Stack.Screen = () => null;
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

jest.mock("../../src/hooks/usePushNotifications", () => ({
  usePushNotifications: jest.fn(),
}));

jest.mock("../../src/hooks/useNotificationTapNavigation", () => ({
  useNotificationTapNavigation: jest.fn(),
}));

jest.mock("../../src/hooks/useDeviceDeletionEnforcement", () => ({
  useDeviceDeletionEnforcement: jest.fn(),
}));

jest.mock("../../src/i18n", () => ({
  hydrateLanguage: jest.fn().mockResolvedValue(undefined),
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

jest.mock("../../src/stores", () => ({
  useSubscriptionStore: {
    getState: () => ({
      fetchSubscription: mockFetchSubscription,
      resetSubscription: mockResetSubscription,
    }),
  },
}));

jest.mock("../../src/stores/tutorialStore", () => ({
  useTutorialStore: () => ({
    tutorialStatus: mockTutorialStatus,
    setTutorialStatus: mockSetTutorialStatus,
    resetTutorialStatus: mockResetTutorialStatus,
  }),
}));

jest.mock("../../src/services/userProfileService", () => ({
  getHasCompletedTutorial: (...args: unknown[]) =>
    mockGetHasCompletedTutorial(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("RootLayoutNav auth gating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTutorialStatus = "idle";
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
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
    expect(mockResetSubscription).toHaveBeenCalled();
    expect(mockResetTutorialStatus).toHaveBeenCalled();
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
    expect(mockFetchSubscription).not.toHaveBeenCalled();
    expect(mockResetSubscription).toHaveBeenCalled();
  });

  it("redirects fully signed-in users with completed tutorial out of auth routes and fetches subscription", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-2" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGetHasCompletedTutorial.mockResolvedValue(true);
    mockTutorialStatus = "completed";
    (useSegments as jest.Mock).mockReturnValue(["(auth)", "login"]);

    render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
      expect(mockFetchSubscription).toHaveBeenCalledWith("user-2");
    });
  });

  it("redirects signed-in users with incomplete tutorial to the tutorial screen", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-3" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGetHasCompletedTutorial.mockResolvedValue(false);
    mockTutorialStatus = "required";
    (useSegments as jest.Mock).mockReturnValue(["(tabs)"]);

    render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/tutorial");
      expect(mockFetchSubscription).toHaveBeenCalledWith("user-3");
    });
  });
});
