import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
const mockUpdateDoc = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "user-doc"),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
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
      };
      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("JlptLevelsScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("renders JLPT levels as a vertical list and shows fetched day metadata", async () => {
    const screen = render(<JlptLevelsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Choose Your JLPT Level")).toBeTruthy();
      expect(screen.getAllByText("N1").length).toBeGreaterThan(0);
      expect(screen.getByText("12 days")).toBeTruthy();
    });
  });

  it("stores the selected level and routes to the standard day screen", async () => {
    const screen = render(<JlptLevelsScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("N1").length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByText("N1")[0]);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith("user-doc", {
        recentCourse: "JLPT_N1",
      });
    });
    expect(await AsyncStorage.getItem("recentCourse")).toBe("JLPT_N1");
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/course/[courseId]/days",
      params: { courseId: "JLPT_N1" },
    });
  });
});
