import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import CourseSelectionScreen from "../app/(tabs)/swipe";

const mockPush = jest.fn();
const mockFetchSubscription = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockLearningLanguage = { current: "ja" as "en" | "ja" };
const mockRecentCourseByLanguage: Partial<Record<"en" | "ja", string>> = {};
let mockCourseProgress: Record<string, Record<number, { completed?: boolean }>> =
  {};
let mockTotalDaysByCourse: Record<string, number> = {};
let mockKeepFocusActive = false;

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const cleanup = callback();
    if (!mockKeepFocusActive && typeof cleanup === "function") {
      cleanup();
    }
  },
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "user-doc"),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
  updateDoc: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
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
  getTotalDaysForCourse: (courseId: string) =>
    Promise.resolve(mockTotalDaysByCourse[courseId] ?? 0),
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: mockLearningLanguage.current,
    recentCourseByLanguage: mockRecentCourseByLanguage,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
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

jest.mock("../components/course", () => ({
  VocaHeader: () => null,
  RecentCourseSection: ({
    course,
    onPress,
    isCompleted,
  }: {
    course: { title: string };
    onPress: () => void;
    isCompleted?: boolean;
  }) => {
    const { Pressable, Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return (
      <Pressable onPress={onPress}>
        <Text>{`recent:${course.title}`}</Text>
        {isCompleted ? <Text>{`completed:${course.title}`}</Text> : null}
      </Pressable>
    );
  },
  AllCoursesSection: ({
    courses,
    onCoursePress,
    completedCourseIds,
  }: {
    courses: { id: string; title: string }[];
    onCoursePress: (course: { id: string; title: string }) => void;
    completedCourseIds?: Record<string, boolean>;
  }) => {
    const { Pressable, Text, View } = jest.requireActual<
      typeof import("react-native")
    >("react-native");
    return (
      <View>
        {courses.map((course) => (
          <Pressable key={course.id} onPress={() => onCoursePress(course)}>
            <Text>{`all:${course.title}`}</Text>
            {completedCourseIds?.[course.id] ? (
              <Text>{`completed:${course.title}`}</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    );
  },
}));

const renderCourseSelection = async () => {
  return render(<CourseSelectionScreen />);
};

describe("CourseSelectionScreen JLPT routing", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockLearningLanguage.current = "ja";
    mockCourseProgress = {};
    mockTotalDaysByCourse = {};
    mockKeepFocusActive = false;
    delete mockRecentCourseByLanguage.en;
    delete mockRecentCourseByLanguage.ja;
    await AsyncStorage.clear();
  });

  it("routes Elementary Japanese to the hub screen for Japanese learners", async () => {
    const screen = await renderCourseSelection();

    fireEvent.press(screen.getByText("Elementary Japanese"));

    expect(mockPush).toHaveBeenCalledWith("/elementary-japanese");
  });

  it("routes JLPT to the level selection screen", async () => {
    const screen = await renderCourseSelection();

    fireEvent.press(screen.getByText("all:JLPT"));

    expect(mockPush).toHaveBeenCalledWith("/course/jlpt-levels");
  });

  it("does not render the recent course section for Japanese learners", async () => {
    mockRecentCourseByLanguage.ja = "JLPT_N2";

    const screen = await renderCourseSelection();

    await waitFor(() => {
      expect(screen.getByText("all:JLPT")).toBeTruthy();
    });

    expect(screen.queryByText("recent:N2")).toBeNull();
  });

  it("keeps the non-Japanese Voca screen free of the Elementary Japanese entry", async () => {
    mockLearningLanguage.current = "en";

    const screen = await renderCourseSelection();

    expect(screen.queryByText("Elementary Japanese")).toBeNull();
  });

  it("keeps the recent course visible in all courses for non-Japanese learners", async () => {
    mockLearningLanguage.current = "en";
    mockRecentCourseByLanguage.en = "TOEIC";

    const screen = await renderCourseSelection();

    expect(screen.getByText("recent:TOEIC")).toBeTruthy();
    expect(screen.getByText("all:TOEIC")).toBeTruthy();
  });

  it("passes completed state to the JLPT parent while keeping it pressable", async () => {
    mockKeepFocusActive = true;
    mockTotalDaysByCourse = {
      JLPT_N1: 1,
      JLPT_N2: 1,
      JLPT_N3: 1,
      JLPT_N4: 1,
      JLPT_N5: 1,
    };
    mockCourseProgress = {
      JLPT_N1: { 1: { completed: true } },
      JLPT_N2: { 1: { completed: true } },
      JLPT_N3: { 1: { completed: true } },
      JLPT_N4: { 1: { completed: true } },
      JLPT_N5: { 1: { completed: true } },
    };

    const screen = await renderCourseSelection();

    await waitFor(() => {
      expect(screen.getByText("completed:JLPT")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("all:JLPT"));

    expect(mockPush).toHaveBeenCalledWith("/course/jlpt-levels");
  });
});
