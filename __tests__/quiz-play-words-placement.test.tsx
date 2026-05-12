import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
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
    quizType: "words_placement",
  }),
  useRouter: () => ({
    back: jest.fn(),
    dismiss: jest.fn(),
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
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mock-doc-ref"),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      gameType: "words_placement",
      items: [
        {
          wordId: "word-1",
          word: "spoil",
          example: "[[[spoil]]] raw",
          wordsToPlace: [
            {
              targetExample: "Too much help may spoil your child.",
              chunks: [
                {
                  id: "chunk-1",
                  text: "Too much help may",
                  type: "sentence_chunk",
                  order: 1,
                },
                {
                  id: "chunk-2",
                  text: "spoil",
                  type: "answer",
                  order: 2,
                },
              ],
            },
            {
              targetExample: "Parents should not spoil children.",
              chunks: [
                {
                  id: "chunk-3",
                  text: "Parents should not",
                  type: "sentence_chunk",
                  order: 1,
                },
                {
                  id: "chunk-4",
                  text: "spoil children.",
                  type: "answer",
                  order: 2,
                },
              ],
            },
          ],
        },
      ],
    }),
  }),
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

jest.mock("../components/common/AppSplashScreen", () => ({
  AppSplashScreen: ({ visible }: { visible: boolean }) => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return visible ? <Text>Preparing quiz...</Text> : null;
  },
}));

jest.mock("../components/course", () => ({
  EmptyQuizScreen: () => null,
  GameBoard: ({
    currentQuestion,
    onAnswer,
  }: {
    currentQuestion: { id: string; word: string };
    onAnswer: (answer: string) => void;
  }) => {
    const { Button, Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");

    return (
      <View>
        <Text>{`question:${currentQuestion.id}`}</Text>
        <Text>{`word:${currentQuestion.word}`}</Text>
        <Button
          title="wrong"
          onPress={() => onAnswer("chunk-2|chunk-1")}
        />
      </View>
    );
  },
  QuizFinishView: () => null,
  QuizHeader: () => null,
  QuizTimer: () => null,
}));

describe("QuizPlayScreen words_placement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the same round after an incorrect placement submit", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("question:word-1-0")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("wrong"));

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    await waitFor(() => {
      expect(screen.getByText("question:word-1-0")).toBeTruthy();
    });
    expect(screen.queryByText("question:word-1-1")).toBeNull();
  });
});
