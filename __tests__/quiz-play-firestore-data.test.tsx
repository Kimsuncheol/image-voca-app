import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import React from "react";
import QuizPlayScreen from "../app/course/[courseId]/quiz-play";

const mockBack = jest.fn();
const mockFetchCourseQuizData = jest.fn();
const mockPrefetchVocabularyCards = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockBufferQuizAnswer = jest.fn();
const mockFlushQuizStats = jest.fn();
const mockUpdateCourseDayProgress = jest.fn();
const mockStackScreenOptions: Record<string, unknown>[] = [];
const mockQuizTimerProps: { isRunning: boolean; quizKey: string }[] = [];

let mockParams = {
  courseId: "TOEIC",
  day: "5",
  quizType: "matching",
};

jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options: Record<string, unknown> }) => {
      mockStackScreenOptions.push(options);
      return null;
    },
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => mockParams,
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
    onSelectWord,
    onSelectMeaning,
  }: {
    quizType: string;
    matchingMeanings: string[];
    currentQuestion: {
      word: string;
      correctAnswer: string;
      options?: { word: string }[];
    };
    onSelectWord: (word: string) => void;
    onSelectMeaning: (meaning: string) => void;
  }) => {
    const { Button, Text, View } = jest.requireActual<typeof import("react-native")>(
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
        <Button
          title="select-current-word"
          onPress={() => onSelectWord(currentQuestion.word)}
        />
        <Button
          title="select-correct-meaning"
          onPress={() => onSelectMeaning(currentQuestion.correctAnswer)}
        />
        <Button
          title="select-incorrect-meaning"
          onPress={() => onSelectMeaning("not-the-answer")}
        />
      </View>
    );
  },
  QuizFinishView: () => null,
  QuizTimer: ({
    isRunning,
    quizKey,
  }: {
    isRunning: boolean;
    quizKey: string;
  }) => {
    mockQuizTimerProps.push({ isRunning, quizKey });
    return null;
  },
}));

const getLatestStackScreenOptions = () =>
  mockStackScreenOptions[mockStackScreenOptions.length - 1];
const getLatestQuizTimerProps = () =>
  mockQuizTimerProps[mockQuizTimerProps.length - 1];

describe("QuizPlayScreen Firestore quiz data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStackScreenOptions.length = 0;
    mockQuizTimerProps.length = 0;
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
    expect(mockStackScreenOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ headerShown: false }),
      ]),
    );
    expect(getLatestStackScreenOptions()).toEqual(
      expect.objectContaining({
        headerShown: true,
        title: "Matching 0/1",
      }),
    );
  });

  it("pauses the timer while the quit prompt is open and resumes on cancel", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
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
      matchingChoices: ["first"],
    });

    render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ isRunning: true, quizKey: "matching-0" }),
      );
    });

    const headerLeft = getLatestStackScreenOptions()?.headerLeft as () => React.ReactElement;

    act(() => {
      headerLeft().props.onPress();
    });

    expect(alertSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ isRunning: false, quizKey: "matching-0" }),
      );
    });

    const cancelButton = alertSpy.mock.calls[0][2]?.[0];

    act(() => {
      cancelButton?.onPress?.();
    });

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ isRunning: true, quizKey: "matching-0" }),
      );
    });

    const quitButton = alertSpy.mock.calls[0][2]?.[1];

    act(() => {
      headerLeft().props.onPress();
    });
    act(() => {
      quitButton?.onPress?.();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });

  it("resets the matching timer key after correct matches only", async () => {
    mockFetchCourseQuizData.mockResolvedValue({
      questions: [
        {
          id: "i1",
          word: "alpha",
          meaning: "first",
          matchChoiceText: "first",
          correctAnswer: "first",
        },
        {
          id: "i2",
          word: "beta",
          meaning: "second",
          matchChoiceText: "second",
          correctAnswer: "second",
        },
      ],
      matchingChoices: ["first", "second"],
    });

    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ quizKey: "matching-0" }),
      );
    });

    act(() => {
      fireEvent.press(screen.getByText("select-current-word"));
    });
    act(() => {
      fireEvent.press(screen.getByText("select-incorrect-meaning"));
    });

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ quizKey: "matching-0" }),
      );
    });

    act(() => {
      fireEvent.press(screen.getByText("select-current-word"));
    });
    act(() => {
      fireEvent.press(screen.getByText("select-correct-meaning"));
    });

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ quizKey: "matching-1" }),
      );
    });
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
    expect(mockStackScreenOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ headerShown: false }),
      ]),
    );
    expect(getLatestStackScreenOptions()).toEqual(
      expect.objectContaining({
        headerShown: true,
        title: "quiz.questionTitle",
      }),
    );
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
