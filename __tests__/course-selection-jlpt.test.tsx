import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import CourseSelectionScreen from "../app/(tabs)/swipe";

const mockPush = jest.fn();
const mockFetchSubscription = jest.fn();

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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
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
    const { Pressable, Text } = require("react-native");
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
    courses: Array<{ id: string; title: string }>;
    onCoursePress: (course: { id: string; title: string }) => void;
  }) => {
    const { Pressable, Text, View } = require("react-native");
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
    await AsyncStorage.clear();
  });

  it("routes JLPT to the level selection screen", async () => {
    const screen = render(<CourseSelectionScreen />);

    fireEvent.press(screen.getByText("JLPT"));

    expect(mockPush).toHaveBeenCalledWith("/course/jlpt-levels");
  });

  it("reopens a recent JLPT level directly to its day screen", async () => {
    await AsyncStorage.setItem("recentCourse", "JLPT_N2");

    const screen = render(<CourseSelectionScreen />);

    await waitFor(() => {
      expect(screen.getByText("recent:N2")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("recent:N2"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/course/[courseId]/days",
      params: { courseId: "JLPT_N2" },
    });
  });
});
