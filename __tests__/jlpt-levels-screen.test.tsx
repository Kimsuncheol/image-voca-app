import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: { children: React.ReactNode }) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

import JlptLevelsScreen from "../app/course/jlpt-levels";

const mockPush = jest.fn();
const mockFetchCourseProgress = jest.fn();
let mockCourseProgress: Record<string, Record<number, { completed?: boolean }>> =
  {};

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: (callback: () => void) => callback(),
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockGetTotalDaysForCourse = jest.fn(async (courseId: string) =>
  courseId === "JLPT_N1" ? 12 : 0,
);

jest.mock("../src/services/vocabularyPrefetch", () => ({
  getTotalDaysForCourse: (courseId: string) => mockGetTotalDaysForCourse(courseId),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
  }),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    courseProgress: mockCourseProgress,
    fetchCourseProgress: mockFetchCourseProgress,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) => {
      const table: Record<string, string> = {
        "courses.jlpt.levels.title": "Choose Your JLPT Level",
        "courses.jlpt.levels.subtitle": "Select a level to open its day list.",
        "courses.jlpt.levelDays": `${options?.count} days`,
        "courses.jlpt.levels.n1.title": "N1",
        "courses.jlpt.levels.n1.description": "Advanced",
        "courses.jlpt.levels.n2.title": "N2",
        "courses.jlpt.levels.n2.description": "Upper Intermediate",
        "courses.jlpt.levels.n3.title": "N3",
        "courses.jlpt.levels.n3.description": "Intermediate",
        "courses.jlpt.levels.n4.title": "N4",
        "courses.jlpt.levels.n4.description": "Elementary",
        "courses.jlpt.levels.n5.title": "N5",
        "courses.jlpt.levels.n5.description": "Beginner",
        "common.back": "Back",
        "common.completed": "Completed",
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("JlptLevelsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCourseProgress = {};
  });

  it("renders JLPT levels as a vertical list without fetched day metadata", async () => {
    const screen = render(<JlptLevelsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Choose Your JLPT Level")).toBeTruthy();
      expect(screen.getAllByText("N1").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(mockGetTotalDaysForCourse).toHaveBeenCalledTimes(5);
    });

    expect(screen.queryByText("12 days")).toBeNull();
  });

  it("routes to the standard day screen with preloaded total days", async () => {
    const screen = render(<JlptLevelsScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("N1").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(mockGetTotalDaysForCourse).toHaveBeenCalledTimes(5);
    });

    fireEvent.press(screen.getAllByText("N1")[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/course/[courseId]/days",
        params: { courseId: "JLPT_N1", initialTotalDays: "12" },
      });
    });
  });

  it("stamps completed JLPT levels while keeping them pressable", async () => {
    mockCourseProgress = {
      JLPT_N1: Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [
          index + 1,
          { completed: true },
        ]),
      ),
    };

    const screen = render(<JlptLevelsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("jlpt-level-completed-JLPT_N1")).toBeTruthy();
    });

    fireEvent.press(screen.getAllByText("N1")[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/course/[courseId]/days",
        params: { courseId: "JLPT_N1", initialTotalDays: "12" },
      });
    });
  });
});
