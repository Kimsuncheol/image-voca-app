import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import QuizPlayScreen from "../app/course/[courseId]/quiz-play";

const mockFetchCourseQuizData = jest.fn();
const mockPrefetchVocabularyCards = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockBufferQuizAnswer = jest.fn();
const mockFlushQuizStats = jest.fn();
const mockUpdateCourseDayProgress = jest.fn();

let mockParams = {
  courseId: "TOEIC",
  day: "5",
  quizType: "matching",
};

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: jest.fn(),
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
    t: (key: string, options?: { current?: number; total?: number }) =>
      key === "quiz.matching.progressTitle"
        ? `Matching ${options?.current}/${options?.total}`
        : key,
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

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mock-doc-ref"),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../src/services/courseQuizDataService", () => ({
  fetchCourseQuizData: (...args: unknown[]) => mockFetchCourseQuizData(...args),
  isFirestoreBackedQuizType: (quizType: string) =>
    ["matching", "fill-in-blank", "gap-fill-sentence", "collocation-matching"].includes(
      quizType,
    ),
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
  EmptyQuizScreen: () => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>EmptyQuizScreen</Text>;
  },
  GameBoard: ({
    quizType,
    matchingMeanings,
    currentQuestion,
  }: {
    quizType: string;
    matchingMeanings: string[];
    currentQuestion: {
      word: string;
      correctAnswer: string;
      options?: { word: string }[];
    };
  }) => {
    const { Text, View } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );

    return (
      <View>
        <Text>{`quizType:${quizType}`}</Text>
        <Text>{`word:${currentQuestion.word}`}</Text>
        <Text>{`correctAnswer:${currentQuestion.correctAnswer}`}</Text>
        <Text>{`matchingMeanings:${matchingMeanings.join(",")}`}</Text>
        <Text>
          {`options:${currentQuestion.options?.map((option) => option.word).join(",") ?? ""}`}
        </Text>
      </View>
    );
  },
  QuizFinishView: () => null,
  QuizTimer: () => null,
}));

describe("QuizPlayScreen Firestore quiz data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {
      courseId: "TOEIC",
      day: "5",
      quizType: "matching",
    };
  });

  it("uses saved Firestore matching data instead of vocabulary prefetch", async () => {
    mockFetchCourseQuizData.mockResolvedValue({
      questions: [
        {
          id: "i1",
          word: "alpha",
          meaning: "first",
          matchChoiceText: "first",
          correctAnswer: "first",
        },
      ],
      matchingChoices: ["second", "first"],
    });

    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("quizType:matching")).toBeTruthy();
    });

    expect(mockFetchCourseQuizData).toHaveBeenCalledWith(
      "TOEIC",
      5,
      "matching",
      "en",
    );
    expect(mockPrefetchVocabularyCards).not.toHaveBeenCalled();
    expect(screen.getByText("word:alpha")).toBeTruthy();
    expect(screen.getByText("matchingMeanings:second,first")).toBeTruthy();
  });

  it("uses saved Firestore fill-in-the-blank data", async () => {
    mockParams = {
      courseId: "TOEIC",
      day: "5",
      quizType: "fill-in-blank",
    };
    mockFetchCourseQuizData.mockResolvedValue({
      questions: [
        {
          id: "q1",
          word: "beta",
          meaning: "beta",
          correctAnswer: "beta",
          clozeSentence: "Alpha ____.",
          options: [{ word: "alpha" }, { word: "beta" }],
        },
      ],
      matchingChoices: [],
    });

    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("quizType:fill-in-blank")).toBeTruthy();
    });

    expect(mockFetchCourseQuizData).toHaveBeenCalledWith(
      "TOEIC",
      5,
      "fill-in-blank",
      "en",
    );
    expect(mockPrefetchVocabularyCards).not.toHaveBeenCalled();
    expect(screen.getByText("correctAnswer:beta")).toBeTruthy();
    expect(screen.getByText("options:alpha,beta")).toBeTruthy();
  });

  it("mounts EmptyQuizScreen when saved quiz data is unavailable", async () => {
    mockFetchCourseQuizData.mockResolvedValue(null);

    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("EmptyQuizScreen")).toBeTruthy();
    });

    expect(mockPrefetchVocabularyCards).not.toHaveBeenCalled();
  });
});
