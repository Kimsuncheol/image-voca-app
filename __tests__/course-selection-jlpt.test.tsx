import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import CourseSelectionScreen from "../app/(tabs)/swipe";

const mockPush = jest.fn();
const mockFetchSubscription = jest.fn();
const mockLearningLanguage = { current: "ja" as "en" | "ja" };
const mockRecentCourseByLanguage: Partial<Record<"en" | "ja", string>> = {};

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => callback(),
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
  }: {
    course: { title: string };
    onPress: () => void;
  }) => {
    const { Pressable, Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return (
      <Pressable onPress={onPress}>
        <Text>{`recent:${course.title}`}</Text>
      </Pressable>
    );
  },
  AllCoursesSection: ({
    courses,
    onCoursePress,
  }: {
    courses: { id: string; title: string }[];
    onCoursePress: (course: { id: string; title: string }) => void;
  }) => {
    const { Pressable, Text, View } = jest.requireActual<
      typeof import("react-native")
    >("react-native");
    return (
      <View>
        {courses.map((course) => (
          <Pressable key={course.id} onPress={() => onCoursePress(course)}>
            <Text>{course.title}</Text>
          </Pressable>
        ))}
      </View>
    );
  },
}));

describe("CourseSelectionScreen JLPT routing", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockLearningLanguage.current = "ja";
    delete mockRecentCourseByLanguage.en;
    delete mockRecentCourseByLanguage.ja;
    await AsyncStorage.clear();
  });

  it("routes Elementary Japanese to the hub screen for Japanese learners", () => {
    const screen = render(<CourseSelectionScreen />);

    fireEvent.press(screen.getByText("Elementary Japanese"));

    expect(mockPush).toHaveBeenCalledWith("/elementary-japanese");
  });

  it("routes JLPT to the level selection screen", async () => {
    const screen = render(<CourseSelectionScreen />);

    fireEvent.press(screen.getByText("JLPT"));

    expect(mockPush).toHaveBeenCalledWith("/course/jlpt-levels");
  });

  it("does not render the recent course section for Japanese learners", async () => {
    mockRecentCourseByLanguage.ja = "JLPT_N2";

    const screen = render(<CourseSelectionScreen />);

    await waitFor(() => {
      expect(screen.getByText("JLPT")).toBeTruthy();
    });

    expect(screen.queryByText("recent:N2")).toBeNull();
  });

  it("keeps the non-Japanese Voca screen free of the Elementary Japanese entry", () => {
    mockLearningLanguage.current = "en";

    const screen = render(<CourseSelectionScreen />);

    expect(screen.queryByText("Elementary Japanese")).toBeNull();
  });
});
