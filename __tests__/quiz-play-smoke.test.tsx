import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import QuizPlayScreen from "../app/course/[courseId]/quiz-play";

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({
    courseId: "TOEIC",
    day: "1",
    quizType: "matching",
  }),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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

jest.mock("../src/hooks/useTimeTracking", () => ({
  useTimeTracking: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => false,
  }),
  getDocs: jest.fn().mockResolvedValue({
    docs: [
      {
        data: () => ({
          word: "alpha",
          meaning: "first",
          pronunciation: "alpha",
          example: "Alpha example",
          translation: "첫 번째",
        }),
      },
      {
        data: () => ({
          word: "beta",
          meaning: "second",
          pronunciation: "beta",
          example: "Beta example",
          translation: "두 번째",
        }),
      },
      {
        data: () => ({
          word: "gamma",
          meaning: "third",
          pronunciation: "gamma",
          example: "Gamma example",
          translation: "세 번째",
        }),
      },
      {
        data: () => ({
          word: "delta",
          meaning: "fourth",
          pronunciation: "delta",
          example: "Delta example",
          translation: "네 번째",
        }),
      },
    ],
  }),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    bufferQuizAnswer: jest.fn(),
    flushQuizStats: jest.fn(),
    courseProgress: {},
    fetchCourseProgress: jest.fn(),
    updateCourseDayProgress: jest.fn(),
  }),
}));

jest.mock("../components/course", () => ({
  GameBoard: ({ courseColor }: { courseColor?: string }) => {
    const React = require("react");
    const { Text, View } = require("react-native");
    return (
      <View>
        <Text>{courseColor ?? "no-color"}</Text>
      </View>
    );
  },
  LoadingView: () => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>loading</Text>;
  },
  QuizFinishView: () => null,
  QuizTimer: () => null,
}));

describe("QuizPlayScreen", () => {
  it("renders without throwing and resolves courseColor from courseId", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("#4ECDC4")).toBeTruthy();
    });
  });
});
