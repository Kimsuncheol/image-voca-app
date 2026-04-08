import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import QuizPlayScreen from "../app/course/[courseId]/quiz-play";

const mockBack = jest.fn();
const mockPrefetchVocabularyCards = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockBufferQuizAnswer = jest.fn();
const mockFlushQuizStats = jest.fn();
const mockUpdateCourseDayProgress = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({
    courseId: "TOEFL_IELTS",
    day: "1",
    quizType: "synonym-matching",
  }),
  useRouter: () => ({
    back: mockBack,
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
    t: (key: string, options?: { defaultValue?: string; current?: number; total?: number }) =>
      options?.defaultValue ??
      (key === "quiz.matching.progressTitle"
        ? `Matching ${options?.current}/${options?.total}`
        : key),
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

jest.mock("../src/hooks/useTimeTracking", () => ({
  useTimeTracking: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mock-doc-ref"),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  prefetchVocabularyCards: (...args: unknown[]) =>
    mockPrefetchVocabularyCards(...args),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    bufferQuizAnswer: mockBufferQuizAnswer,
    flushQuizStats: mockFlushQuizStats,
    courseProgress: {},
    fetchCourseProgress: mockFetchCourseProgress,
    updateCourseDayProgress: mockUpdateCourseDayProgress,
  }),
}));

jest.mock("../components/common/QuizGenerationAnimation", () => ({
  QuizGenerationAnimation: () => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>Loading Quiz</Text>;
  },
}));

jest.mock("../components/course", () => ({
  GameBoard: ({
    quizType,
    matchingMode,
    matchingMeanings,
    currentQuestion,
  }: {
    quizType: string;
    matchingMode: string;
    matchingMeanings: string[];
    currentQuestion: { correctAnswer: string };
  }) => {
    const { Text, View } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );

    return (
      <View>
        <Text>{`quizType:${quizType}`}</Text>
        <Text>{`matchingMode:${matchingMode}`}</Text>
        <Text>{`correctAnswer:${currentQuestion.correctAnswer}`}</Text>
        <Text>{`matchingMeanings:${[...matchingMeanings].sort().join(",")}`}</Text>
      </View>
    );
  },
  QuizFinishView: () => null,
  QuizTimer: () => null,
}));

describe("QuizPlayScreen TOEFL synonym fallback", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockPrefetchVocabularyCards.mockResolvedValue([
      {
        id: "1",
        word: "analyze",
        meaning: "examine",
        example: "Analyze the passage.",
        course: "TOEFL_IELTS",
        synonyms: ["study"],
      },
      {
        id: "2",
        word: "derive",
        meaning: "obtain",
        example: "Derive the answer.",
        course: "TOEFL_IELTS",
        synonyms: [],
      },
      {
        id: "3",
        word: "infer",
        meaning: "conclude",
        example: "Infer the result.",
        course: "TOEFL_IELTS",
      },
      {
        id: "4",
        word: "abstract",
        meaning: "summary",
        example: "Write an abstract.",
        course: "TOEFL_IELTS",
      },
    ]);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("falls back to matching when TOEFL synonym matching has too few synonym-enabled cards", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(
      () => {
        expect(screen.getByText("quizType:matching")).toBeTruthy();
      },
      { timeout: 2000 },
    );

    expect(screen.getByText("matchingMode:meaning")).toBeTruthy();
    expect(screen.getByText("correctAnswer:examine")).toBeTruthy();
    expect(
      screen.getByText("matchingMeanings:conclude,examine,obtain,summary"),
    ).toBeTruthy();
  });
});
