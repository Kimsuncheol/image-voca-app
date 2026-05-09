import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter, useSegments } from "expo-router";
import React from "react";
import { Text as MockText } from "react-native";
import { RootLayoutNav } from "../../app/_layout";
import {
  __resetWordBankMaskStoreForTests,
  useWordBankMaskStore,
} from "../../src/stores/wordBankMaskStore";

const mockReplace = jest.fn();
const mockUseAuth = jest.fn();
let mockGlobalSearchParams: { course?: string } = {};
let mockReviewMaskTarget = "word";
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
    useGlobalSearchParams: jest.fn(() => mockGlobalSearchParams),
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

jest.mock("../../src/hooks/useSpeechPreferences", () => ({
  useSpeechPreferences: () => ({
    vocabularyPreferences: {
      reviewMaskTarget: mockReviewMaskTarget,
    },
  }),
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
    mockGlobalSearchParams = {};
    mockReviewMaskTarget = "word";
    __resetWordBankMaskStoreForTests();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it("renders mask, language, and reading display triggers in the courses native header", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    (useSegments as jest.Mock).mockReturnValue(["courses"]);

    const screen = render(<RootLayoutNav />);

    const maskButton = screen.getByTestId("courses-mask-header-button");
    expect(maskButton).toBeTruthy();
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

  it("hides courses header triggers on the Word Bank JLPT level selection route", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    (useSegments as jest.Mock).mockReturnValue(["courses", "jlpt-levels"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.queryByTestId("courses-mask-header-button")).toBeNull();
    expect(screen.queryByTestId("language-header-button")).toBeNull();
    expect(screen.queryByTestId("eye-comfort-header-button")).toBeNull();
    const coursesScreen = mockStackScreens.find(
      (stackScreen) => stackScreen.name === "courses",
    );
    expect(coursesScreen?.options?.headerRight).toBeTruthy();
  });

  it("toggles the Word Bank mask state from the courses native header", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGlobalSearchParams = { course: "TOEIC" };
    (useSegments as jest.Mock).mockReturnValue(["courses"]);

    const screen = render(<RootLayoutNav />);

    expect(useWordBankMaskStore.getState().isMaskEnabled("TOEIC")).toBe(false);
    fireEvent.press(screen.getByTestId("courses-mask-header-button"));
    expect(useWordBankMaskStore.getState().isMaskEnabled("TOEIC")).toBe(true);
    fireEvent.press(screen.getByTestId("courses-mask-header-button"));
    expect(useWordBankMaskStore.getState().isMaskEnabled("TOEIC")).toBe(false);
  });

  it("keeps Word Bank mask state isolated per course", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    (useSegments as jest.Mock).mockReturnValue(["courses", "[course]"]);

    mockGlobalSearchParams = { course: "TOEIC" };
    const toeicScreen = render(<RootLayoutNav />);

    fireEvent.press(toeicScreen.getByTestId("courses-mask-header-button"));
    expect(useWordBankMaskStore.getState().isMaskEnabled("TOEIC")).toBe(true);
    expect(useWordBankMaskStore.getState().isMaskEnabled("CSAT")).toBe(false);

    toeicScreen.unmount();
    mockStackScreens.length = 0;
    mockGlobalSearchParams = { course: "CSAT" };
    const csatScreen = render(<RootLayoutNav />);

    expect(useWordBankMaskStore.getState().isMaskEnabled("CSAT")).toBe(false);
    fireEvent.press(csatScreen.getByTestId("courses-mask-header-button"));

    expect(useWordBankMaskStore.getState().isMaskEnabled("CSAT")).toBe(true);
    expect(useWordBankMaskStore.getState().isMaskEnabled("TOEIC")).toBe(true);
  });

  it("hides the courses mask trigger for Kanji saved words when target is synonym", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGlobalSearchParams = { course: "KANJI" };
    mockReviewMaskTarget = "synonym";
    (useSegments as jest.Mock).mockReturnValue(["courses", "[course]"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.queryByTestId("courses-mask-header-button")).toBeNull();
    expect(screen.getByTestId("language-header-button")).toBeTruthy();
    expect(screen.getByTestId("eye-comfort-header-button")).toBeTruthy();
  });

  it("keeps the courses mask trigger for Kanji saved words when target is word", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGlobalSearchParams = { course: "KANJI" };
    mockReviewMaskTarget = "word";
    (useSegments as jest.Mock).mockReturnValue(["courses", "[course]"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.getByTestId("courses-mask-header-button")).toBeTruthy();
  });

  it("hides the courses mask trigger for JLPT saved words when target is reading", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGlobalSearchParams = { course: "JLPT_N5" };
    mockReviewMaskTarget = "reading";
    (useSegments as jest.Mock).mockReturnValue(["courses", "[course]"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.queryByTestId("courses-mask-header-button")).toBeNull();
    expect(screen.getByTestId("language-header-button")).toBeTruthy();
    expect(screen.getByTestId("eye-comfort-header-button")).toBeTruthy();
  });

  it("keeps the courses mask trigger for JLPT saved words when target is word", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGlobalSearchParams = { course: "JLPT_N5" };
    mockReviewMaskTarget = "word";
    (useSegments as jest.Mock).mockReturnValue(["courses", "[course]"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.getByTestId("courses-mask-header-button")).toBeTruthy();
  });

  it("keeps the courses mask trigger for non-Kanji saved words when target is synonym", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGlobalSearchParams = { course: "TOEIC" };
    mockReviewMaskTarget = "synonym";
    (useSegments as jest.Mock).mockReturnValue(["courses", "[course]"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.getByTestId("courses-mask-header-button")).toBeTruthy();
  });

  it("keeps the courses mask trigger for non-Japanese saved words when target is reading", () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      authStatus: "signed_in",
    });
    mockGlobalSearchParams = { course: "TOEIC" };
    mockReviewMaskTarget = "reading";
    (useSegments as jest.Mock).mockReturnValue(["courses", "[course]"]);

    const screen = render(<RootLayoutNav />);

    expect(screen.getByTestId("courses-mask-header-button")).toBeTruthy();
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
