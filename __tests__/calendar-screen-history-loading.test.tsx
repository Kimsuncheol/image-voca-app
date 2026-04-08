import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import CalendarScreen from "../app/calendar";

const mockFetchStats = jest.fn();
const mockFetchDailyStudyHistory = jest.fn();
const mockRouterPush = jest.fn();

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => callback(),
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "calendar.detail.studiedCourses") return "Studied courses";
      if (key === "calendar.detail.loadingStudiedCourses") {
        return "Loading studied courses...";
      }
      if (key === "calendar.detail.noStudiedCourses") {
        return "No completed vocabulary day recorded for this date.";
      }
      if (key === "calendar.detail.wordsProgress") {
        return `${options?.learned} / ${options?.total} words`;
      }
      if (key === "calendar.detail.dayLabel") {
        return `Day ${options?.count}`;
      }
      return options?.defaultValue ?? key;
    },
    i18n: { language: "en" },
  }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, ...props }: { children: React.ReactNode }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock("../src/services/dailyStudyHistory", () => ({
  fetchDailyStudyHistory: (...args: unknown[]) =>
    mockFetchDailyStudyHistory(...args),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    stats: {
      currentStreak: 1,
      lastActiveDate: "2026-04-08",
      dailyStats: [
        {
          date: "2026-04-08",
          wordsLearned: 88,
          learnedWordIds: [],
          correctAnswers: 0,
          totalAnswers: 0,
          timeSpentMinutes: 1424,
        },
      ],
    },
    fetchStats: mockFetchStats,
  }),
}));

jest.mock("../components/calendar/CalendarMonthSummaryCard", () => ({
  CalendarMonthSummaryCard: () => null,
}));

jest.mock("../components/calendar/CalendarMonthGrid", () => ({
  CalendarMonthGrid: () => null,
}));

describe("CalendarScreen history loading", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetchDailyStudyHistory.mockResolvedValue({
      date: "2026-04-08",
      updatedAt: "2026-04-08T00:00:00.000Z",
      vocabularyDays: [
        {
          courseId: "TOEFL_IELTS",
          dayNumber: 1,
          wordsLearned: 20,
          totalWords: 20,
          completedAt: "2026-04-08T00:00:00.000Z",
        },
      ],
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("clears the loading state and renders studied courses when history resolves", async () => {
    const screen = render(<CalendarScreen />);

    expect(screen.getByText("Loading studied courses...")).toBeTruthy();

    await waitFor(() => {
      expect(mockFetchDailyStudyHistory).toHaveBeenCalledWith("user-1", "2026-04-08");
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading studied courses...")).toBeNull();
      expect(screen.getByText("TOEFL / IELTS")).toBeTruthy();
      expect(screen.getByText("20 / 20 words")).toBeTruthy();
      expect(screen.getByText("Day 1")).toBeTruthy();
    });
  });

  it("navigates to the exact vocabulary day when a studied course row is pressed", async () => {
    const screen = render(<CalendarScreen />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeTruthy();
    });

    fireEvent.press(screen.getByRole("button"));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/course/[courseId]/vocabulary",
      params: { courseId: "TOEFL_IELTS", day: "1" },
    });
  });
});
