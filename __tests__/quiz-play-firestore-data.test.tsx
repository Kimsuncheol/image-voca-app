import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import React from "react";
import QuizPlayScreen from "../app/course/[courseId]/quiz-play";
import {
  __resetReadingDisplayStoreForTests,
  useReadingDisplayStore,
} from "../src/stores/readingDisplayStore";

const mockBack = jest.fn();
const mockDismiss = jest.fn();
const mockFetchCourseQuizData = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockBufferQuizAnswer = jest.fn();
const mockFlushQuizStats = jest.fn();
const mockUpdateCourseDayProgress = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
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
    dismiss: mockDismiss,
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
    t: (key: string) => key,
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
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../src/services/courseQuizDataService", () => ({
  fetchCourseQuizData: (...args: unknown[]) => mockFetchCourseQuizData(...args),
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
  }: {
    quizType: string;
    matchingMeanings: string[];
    currentQuestion: {
      word: string;
      correctAnswer: string;
    };
    onSelectWord: (word: string) => void;
    onSelectMeaning: (meaning: string) => void;
    onMatchingPageAdvance?: () => void;
  }) => {
    const { Button, Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");

    return (
      <View>
        <Text>{`quizType:${quizType}`}</Text>
        <Text>{`word:${currentQuestion.word}`}</Text>
        <Text>{`correctAnswer:${currentQuestion.correctAnswer}`}</Text>
        <Text>{`matchingMeanings:${matchingMeanings.join(",")}`}</Text>
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
      </View>
    );
  },
  QuizFinishView: ({
    score,
    totalQuestions,
    onRetry,
    onFinish,
  }: {
    score: number;
    totalQuestions: number;
    onRetry: () => void;
    onFinish: () => void;
  }) => {
    const { Button, Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View>
        <Text>{`QuizFinishView:${score}/${totalQuestions}`}</Text>
        <Button title="retry" onPress={onRetry} />
        <Button title="finish" onPress={onFinish} />
      </View>
    );
  },
  QuizHeader: ({
    onQuit,
    rightAction,
  }: {
    onQuit: () => void;
    rightAction?: React.ReactNode;
  }) => {
    const { Button, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View>
        <Button title="quit-quiz" onPress={onQuit} />
        {rightAction}
      </View>
    );
  },
  QuizTimer: (props: {
    duration: number;
    onTimeUp: () => void;
    isRunning: boolean;
    quizKey: string;
  }) => {
    mockQuizTimerProps.push({
      isRunning: props.isRunning,
      quizKey: props.quizKey,
    });
    const { Button, Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View>
        <Text>{`timer:${props.duration}:${props.quizKey}:${props.isRunning}`}</Text>
        <Button title="time-up" onPress={props.onTimeUp} />
      </View>
    );
  },
}));

jest.mock("../components/common/AppSplashScreen", () => ({
  AppSplashScreen: ({ visible }: { visible: boolean }) => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return visible ? <Text>Preparing quiz...</Text> : null;
  },
}));

jest.mock("../src/components/common/EyeComfortHeaderButton", () => ({
  EyeComfortHeaderButton: () => null,
}));

const getLatestQuizTimerProps = () =>
  mockQuizTimerProps[mockQuizTimerProps.length - 1];

const matchingQuiz = {
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
  matchingChoices: ["second", "first"],
};

describe("QuizPlayScreen matching", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    __resetReadingDisplayStoreForTests();
    mockParams = {
      courseId: "TOEIC",
      day: "5",
      quizType: "matching",
    };
    mockStackScreenOptions.length = 0;
    mockQuizTimerProps.length = 0;
    mockFetchCourseQuizData.mockResolvedValue(matchingQuiz);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads saved matching quiz data", async () => {
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
    expect(screen.getByText("word:alpha")).toBeTruthy();
    expect(screen.getByText("matchingMeanings:second,first")).toBeTruthy();
    expect(mockStackScreenOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ headerShown: false }),
      ]),
    );
  });

  it("sanitizes stale non-matching route params to matching", async () => {
    mockParams = {
      courseId: "TOEIC",
      day: "5",
      quizType: "fill-in-blank",
    };

    render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(mockFetchCourseQuizData).toHaveBeenCalledWith(
        "TOEIC",
        5,
        "matching",
        "en",
      );
    });
  });

  it("scores correct matches and saves completion", async () => {
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
      expect(screen.getByText("quizType:matching")).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByText("select-current-word"));
    });
    await act(async () => {
      fireEvent.press(screen.getByText("select-correct-meaning"));
    });

    await waitFor(() => {
      expect(screen.getByText("QuizFinishView:1/1")).toBeTruthy();
    });
    expect(mockBufferQuizAnswer).toHaveBeenCalledWith("user-1", true);
    expect(mockSetDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      expect.objectContaining({
        quizType: "matching",
        score: 1,
        totalQuestions: 1,
        percentage: 100,
      }),
    );
    expect(mockUpdateCourseDayProgress).toHaveBeenCalledWith(
      "TOEIC",
      5,
      expect.objectContaining({
        quizCompleted: true,
        quizScore: 100,
        accumulatedCorrect: 1,
        isRetake: true,
      }),
    );
    expect(mockFlushQuizStats).toHaveBeenCalledWith("user-1");
  });

  it("finishes after three incorrect attempts without increasing score", async () => {
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
        jest.advanceTimersByTime(1500);
      });
    }

    expect(screen.getByText("QuizFinishView:0/2")).toBeTruthy();
    expect(mockBufferQuizAnswer).toHaveBeenCalledTimes(3);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(1, "user-1", false);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(2, "user-1", false);
    expect(mockBufferQuizAnswer).toHaveBeenNthCalledWith(3, "user-1", false);
  });

  it("resets timer on correct matches and matching page advance", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ quizKey: "matching-0" }),
      );
    });

    act(() => {
      fireEvent.press(screen.getByText("select-current-word"));
    });
    await act(async () => {
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

  it("pauses the timer while the reading display modal is open", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ isRunning: true }),
      );
    });

    act(() => {
      useReadingDisplayStore.getState().openDisplayModal({
        title: "Example",
        lines: ["Line"],
      });
    });

    await waitFor(() => {
      expect(getLatestQuizTimerProps()).toEqual(
        expect.objectContaining({ isRunning: false }),
      );
    });

    expect(screen.getByText("quizType:matching")).toBeTruthy();
  });

  it("finishes with current score on time up", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("quizType:matching")).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByText("time-up"));
    });

    expect(screen.getByText("QuizFinishView:0/2")).toBeTruthy();
  });

  it("shows the quit confirmation before leaving", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("quizType:matching")).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByText("quit-quiz"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "quiz.quit.title",
      "quiz.quit.message",
      expect.any(Array),
      expect.any(Object),
    );

    alertSpy.mockRestore();
  });

  it("mounts EmptyQuizScreen when saved quiz data is unavailable", async () => {
    mockFetchCourseQuizData.mockResolvedValue(null);

    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("EmptyQuizScreen")).toBeTruthy();
    });
  });

  it("supports retry after finishing", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("quizType:matching")).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByText("time-up"));
    });
    expect(screen.getByText("QuizFinishView:0/2")).toBeTruthy();

    act(() => {
      fireEvent.press(screen.getByText("retry"));
    });

    expect(screen.getByText("quizType:matching")).toBeTruthy();
  });

  it("dismisses back to course flow from finish screen", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("quizType:matching")).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByText("time-up"));
    });
    act(() => {
      fireEvent.press(screen.getByText("finish"));
    });

    expect(mockDismiss).toHaveBeenCalledWith(2);
  });
});
