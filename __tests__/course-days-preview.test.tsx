import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import DayPickerScreen from "../app/course/[courseId]/days";

const mockPush = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockFetchSubscription = jest.fn();
const mockPrefetchVocabularyCards: jest.Mock = jest.fn(async () => [
  {
    id: "word-1",
    word: "lift",
    meaning: "raise",
    example: "Lift the box.",
    course: "TOEIC",
    imageUrl: "https://example.com/lift.png",
  },
]);
const mockStackScreen: jest.Mock = jest.fn(() => null);
let mockCourseId = "TOEIC";
let mockTotalDays = 3;
let mockCourseProgress: Record<string, Record<number, { completed?: boolean }>> =
  {};

jest.mock("expo-router", () => ({
  Stack: {
    Screen: (props: unknown) => mockStackScreen(props),
  },
  useFocusEffect: (callback: () => void | (() => void)) => callback(),
  useLocalSearchParams: () => ({
    courseId: mockCourseId,
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("expo-image", () => ({
  Image: {
    prefetch: jest.fn(async () => true),
  },
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("../components/ads/TopInstallNativeAd", () => ({
  TopInstallNativeAd: () => null,
}));

jest.mock("../components/common/AppSplashScreen", () => ({
  AppSplashScreen: () => null,
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
  }),
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    recentCourseByLanguage: {},
    setRecentCourseForLanguage: jest.fn(async () => undefined),
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/stores", () => ({
  useSubscriptionStore: () => ({
    fetchSubscription: mockFetchSubscription,
  }),
  useUserStatsStore: () => ({
    courseProgress: mockCourseProgress,
    fetchCourseProgress: mockFetchCourseProgress,
  }),
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  getTotalDaysForCourse: jest.fn(async () => mockTotalDays),
  prefetchVocabularyCards: (courseId: string, day: number) =>
    mockPrefetchVocabularyCards(courseId, day),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const table: Record<string, string> = {
        "course.preview": "Preview",
        "course.previewSelectDay": "Select a day to preview",
        "common.back": "Back",
        "common.cancel": "Cancel",
        "course.days": "Days",
        "course.continueFrom": "Continue",
        "course.progress": `${options?.learned}/${options?.total} words`,
      };
      if (key === "course.dayTitle") return `Day ${options?.day}`;
      return table[key] ?? String(options?.defaultValue ?? key);
    },
  }),
}));

describe("DayPickerScreen preview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCourseId = "TOEIC";
    mockTotalDays = 3;
    mockCourseProgress = { TOEIC: { 1: { completed: true } } };
  });

  it("matches the native header background to the day screen background", async () => {
    render(<DayPickerScreen />);

    await waitFor(() => {
      expect(mockStackScreen).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#000",
          }),
        }),
      );
    });
  });

  it("opens a preview day selector with locked days and routes read-only preview", async () => {
    const screen = render(<DayPickerScreen />);

    await waitFor(() => {
      expect(screen.getByText("Preview")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Preview"));

    expect(screen.getAllByText("Day 3").length).toBeGreaterThan(0);

    fireEvent.press(screen.getAllByText("Day 3").at(-1)!);

    await waitFor(() => {
      expect(mockPrefetchVocabularyCards).toHaveBeenCalledWith("TOEIC", 3);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/course/[courseId]/vocabulary",
        params: { courseId: "TOEIC", day: "3", preview: "1" },
      });
    });
  });

  it("does not show preview for excluded deck courses", async () => {
    mockCourseId = "KANJI";
    mockCourseProgress = {};

    const screen = render(<DayPickerScreen />);

    await waitFor(() => {
      expect(screen.queryByText("Preview")).toBeNull();
    });
  });
});
