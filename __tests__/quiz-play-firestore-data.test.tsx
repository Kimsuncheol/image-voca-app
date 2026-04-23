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
    user: { uid: "user-1" },
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mock-doc-ref"),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => false,
  }),
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
    onMatchingPageAdvance,
    onAnswer,
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
    onMatchingPageAdvance?: () => void;
    onAnswer: (answer: string) => void;
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
        <Button
          title="advance-matching-page"
          onPress={() => onMatchingPageAdvance?.()}
        />
        <Button
          title="select-correct-answer"
          onPress={() => onAnswer(currentQuestion.correctAnswer)}
        />
        <Button
          title="select-incorrect-answer"
          onPress={() => onAnswer("not-the-answer")}
        />
      </View>
    );
  },
  QuizFinishView: ({
    score,
    totalQuestions,
  }: {
    score: number;
    totalQuestions: number;
  }) => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>{`QuizFinishView:${score}/${totalQuestions}`}</Text>;
  },
  QuizHeader: ({ onQuit }: { onQuit: () => void }) => {
    const { Button } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Button title="quit-quiz" onPress={onQuit} />;
  },
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
const advanceAnswerFeedback = () => {
  act(() => {
    jest.advanceTimersByTime(1500);
  });
};

describe("QuizPlayScreen Firestore quiz data", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockStackScreenOptions.length = 0;
    mockQuizTimerProps.length = 0;
    mockParams = {
      courseId: "TOEIC",
      day: "5",
      quizType: "matching",
    };
  });

  afterEach(() => {
    jest.useRealTimers();
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
      expect.objectContaining({ headerShown: false }),
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

    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ isRunning: true, quizKey: "matching-0" }),
      );
    });

    act(() => {
      fireEvent.press(screen.getByText("quit-quiz"));
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
      fireEvent.press(screen.getByText("quit-quiz"));
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

    jest.useFakeTimers();
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

    advanceAnswerFeedback();

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

  it("resets the matching timer key when the matching page advances", async () => {
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
        {
          id: "i3",
          word: "gamma",
          meaning: "third",
          matchChoiceText: "third",
          correctAnswer: "third",
        },
        {
          id: "i4",
          word: "delta",
          meaning: "fourth",
          matchChoiceText: "fourth",
          correctAnswer: "fourth",
        },
        {
          id: "i5",
          word: "epsilon",
          meaning: "fifth",
          matchChoiceText: "fifth",
          correctAnswer: "fifth",
        },
        {
          id: "i6",
          word: "zeta",
          meaning: "sixth",
          matchChoiceText: "sixth",
          correctAnswer: "sixth",
        },
      ],
      matchingChoices: ["first", "second", "third", "fourth", "fifth", "sixth"],
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
      fireEvent.press(screen.getByText("select-correct-meaning"));
    });

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ quizKey: "matching-1" }),
      );
    });

    act(() => {
      fireEvent.press(screen.getByText("advance-matching-page"));
    });

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ quizKey: "matching-2" }),
      );
    });
  });

  it("finishes matching after three incorrect attempts without increasing score", async () => {
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
      expect(screen.getByText("quizType:matching")).toBeTruthy();
    });

    jest.useFakeTimers();
    for (let i = 0; i < 3; i += 1) {
      act(() => {
        fireEvent.press(screen.getByText("select-current-word"));
      });
      act(() => {
        fireEvent.press(screen.getByText("select-incorrect-meaning"));
      });
      advanceAnswerFeedback();
    }

    expect(screen.getByText("QuizFinishView:0/2")).toBeTruthy();

    expect(screen.queryByText("quizType:matching")).toBeNull();
    expect(mockBufferQuizAnswer).toHaveBeenCalledTimes(3);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(1, "user-1", false);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(2, "user-1", false);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(3, "user-1", false);
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
      expect.objectContaining({ headerShown: false }),
    );
  });

  it("finishes fill-in-the-blank after three incorrect answers without advancing", async () => {
    mockParams = {
      courseId: "TOEIC",
      day: "5",
      quizType: "fill-in-blank",
    };
    mockFetchCourseQuizData.mockResolvedValue({
      questions: [
        {
          id: "q1",
          word: "alpha",
          meaning: "alpha",
          correctAnswer: "alpha",
          clozeSentence: "Pick ____.",
          options: [{ word: "alpha" }, { word: "wrong" }],
        },
        {
          id: "q2",
          word: "beta",
          meaning: "beta",
          correctAnswer: "beta",
          clozeSentence: "Pick ____.",
          options: [{ word: "beta" }, { word: "wrong" }],
        },
        {
          id: "q3",
          word: "gamma",
          meaning: "gamma",
          correctAnswer: "gamma",
          clozeSentence: "Pick ____.",
          options: [{ word: "gamma" }, { word: "wrong" }],
        },
      ],
      matchingChoices: [],
    });

    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("word:alpha")).toBeTruthy();
    });

    jest.useFakeTimers();
    for (let i = 0; i < 3; i += 1) {
      act(() => {
        fireEvent.press(screen.getByText("select-incorrect-answer"));
      });
    }

    advanceAnswerFeedback();

    expect(screen.getByText("QuizFinishView:0/3")).toBeTruthy();

    expect(screen.queryByText("word:beta")).toBeNull();
    expect(mockBufferQuizAnswer).toHaveBeenCalledTimes(3);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(1, "user-1", false);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(2, "user-1", false);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(3, "user-1", false);
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
