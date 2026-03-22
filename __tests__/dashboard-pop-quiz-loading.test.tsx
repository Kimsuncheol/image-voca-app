import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { DashboardPopQuiz } from "../components/dashboard/DashboardPopQuiz";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style }: any) => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual("react-native");
    return ReactModule.createElement(Text, { style }, children);
  },
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
  }),
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: "en",
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    bufferQuizAnswer: jest.fn(),
    flushQuizStats: jest.fn(),
  }),
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  getTotalDaysForCourse: jest.fn(async () => 0),
}));

jest.mock("../src/utils/localizedVocabulary", () => ({
  resolveQuizVocabulary: (word: any) => word,
}));

jest.mock("../components/dashboard/constants/quizConfig", () => ({
  getDebugTotalDaysCourses: () => [],
  getQuizCoursesForLanguage: () => [{ id: "TOEIC", wordsPerCourse: 2 }],
}));

const mockUseQuizBatchFetcher = jest.fn();
jest.mock("../components/dashboard/hooks/useQuizBatchFetcher", () => ({
  useQuizBatchFetcher: (...args: any[]) => mockUseQuizBatchFetcher(...args),
}));

jest.mock("../components/dashboard/utils/quizHelpers", () => ({
  buildDashboardQuizPayload: (wordData: any, batch: any[]) => ({
    quizItem: {
      word: wordData.word,
      meaning: wordData.meaning,
    },
    options: batch.map((item) => item.meaning),
    wordOptions: [],
    matchingPairs: [],
  }),
}));

jest.mock("../components/common/QuizGenerationAnimation", () => ({
  QuizGenerationAnimation: ({ mode }: { mode: string }) => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual("react-native");
    return ReactModule.createElement(Text, null, `creating-${mode}`);
  },
}));

jest.mock("../components/dashboard/QuizHeader", () => ({
  QuizHeader: () => null,
}));

jest.mock("../components/dashboard/QuizStoppedState", () => ({
  QuizStoppedState: () => null,
}));

jest.mock("../components/dashboard/quiz-types/MatchingQuiz", () => ({
  MatchingQuiz: () => null,
}));

jest.mock("../components/dashboard/quiz-types/FillInBlankQuiz", () => ({
  FillInBlankQuiz: () => null,
}));

jest.mock("../components/dashboard/quiz-types/MultipleChoiceQuiz", () => ({
  MultipleChoiceQuiz: ({ quizItem, onOptionPress }: any) => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Pressable, Text, View } = jest.requireActual("react-native");
    return ReactModule.createElement(
      View,
      null,
      ReactModule.createElement(Text, null, quizItem.word),
      ReactModule.createElement(
        Pressable,
        { onPress: () => onOptionPress(quizItem.meaning) },
        ReactModule.createElement(Text, null, `answer-${quizItem.meaning}`),
      ),
    );
  },
}));

describe("DashboardPopQuiz loading states", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("shows the generation animation before the first quiz item is ready", async () => {
    const initialBatch = createDeferred<any[]>();
    const fetchBatch = jest.fn(() => initialBatch.promise);
    const prefetchNextBatch = jest.fn(async () => []);

    mockUseQuizBatchFetcher.mockReturnValue({
      fetchBatch,
      prefetchNextBatch,
      isPrefetching: false,
    });

    const screen = render(<DashboardPopQuiz />);

    expect(screen.getByText("creating-card")).toBeTruthy();

    await act(async () => {
      initialBatch.resolve([
        { word: "alpha", meaning: "first", course: "TOEIC" },
      ]);
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(499);
    });

    expect(screen.queryByText("alpha")).toBeNull();
    expect(screen.getByText("creating-card")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeTruthy();
    });
  });

  it("does not show the generation animation during normal in-batch transitions", async () => {
    const fetchBatch = jest.fn(async () => [
      { word: "alpha", meaning: "first", course: "TOEIC" },
      { word: "beta", meaning: "second", course: "TOEIC" },
    ]);
    const prefetchNextBatch = jest.fn(async () => []);

    mockUseQuizBatchFetcher.mockReturnValue({
      fetchBatch,
      prefetchNextBatch,
      isPrefetching: false,
    });

    const screen = render(<DashboardPopQuiz />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("answer-first"));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("beta")).toBeTruthy();
    });

    expect(screen.queryByText("creating-card")).toBeNull();
  });

  it("shows rollover loading only when the next batch is still pending", async () => {
    const nextBatch = createDeferred<any[]>();
    const fetchBatch = jest.fn(async () => [
      { word: "alpha", meaning: "first", course: "TOEIC" },
    ]);
    const prefetchNextBatch = jest.fn(() => nextBatch.promise);

    mockUseQuizBatchFetcher.mockReturnValue({
      fetchBatch,
      prefetchNextBatch,
      isPrefetching: false,
    });

    const screen = render(<DashboardPopQuiz />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("answer-first"));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByText("creating-card")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(149);
    });

    expect(screen.queryByText("creating-card")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText("creating-card")).toBeTruthy();

    await act(async () => {
      nextBatch.resolve([
        { word: "gamma", meaning: "third", course: "TOEIC" },
      ]);
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(499);
    });

    expect(screen.queryByText("gamma")).toBeNull();
    expect(screen.getByText("creating-card")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(screen.getByText("gamma")).toBeTruthy();
    });
  });
});
