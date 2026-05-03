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
  TopInstallNativeAd: () => {
    throw new Error("TopInstallNativeAd should not render on DaysScreen");
  },
}));

jest.mock("../components/ads/TopBannerAd", () => ({
  TopBannerAd: ({ includeTopInset }: { includeTopInset?: boolean }) => {
    const { Text } = require("react-native");
    return <Text>TopBannerAd:{String(includeTopInset)}</Text>;
  },
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
        "course.checked": "Completed",
        "course.progress": `${options?.learned}/${options?.total} words`,
      };
      if (key === "course.dayTitle") return `Day ${options?.day}`;
      return table[key] ?? String(options?.defaultValue ?? key);
    },
  }),
}));

describe("DayPickerScreen study modes", () => {
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

  it("does not render learning and review chips", async () => {
    const screen = render(<DayPickerScreen />);

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeTruthy();
    });

    expect(screen.queryByText("Learning")).toBeNull();
    expect(screen.queryByText("Review")).toBeNull();
  });

  it("renders the top banner ad without a top inset", async () => {
    const screen = render(<DayPickerScreen />);

    await waitFor(() => {
      expect(screen.getByText("TopBannerAd:false")).toBeTruthy();
    });
  });

  it("keeps progress UI visible and routes days without mode", async () => {
    const screen = render(<DayPickerScreen />);

    await waitFor(() => {
      expect(screen.getByText("Continue")).toBeTruthy();
      expect(screen.getByText("Completed")).toBeTruthy();
    });

    fireEvent.press(screen.getAllByText("Day 2")[0]);

    await waitFor(() => {
      expect(mockPrefetchVocabularyCards).toHaveBeenCalledWith("TOEIC", 2);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/course/[courseId]/vocabulary",
        params: { courseId: "TOEIC", day: "2" },
      });
    });
  });

  it("routes days without mode by default", async () => {
    const screen = render(<DayPickerScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Day 2").length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByText("Day 2")[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/course/[courseId]/vocabulary",
        params: { courseId: "TOEIC", day: "2" },
      });
    });
  });
});
