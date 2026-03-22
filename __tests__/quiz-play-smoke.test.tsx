import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";
import QuizPlayScreen from "../app/course/[courseId]/quiz-play";
import * as vocabularyPrefetch from "../src/services/vocabularyPrefetch";
import { __resetVocabularyPrefetchStateForTests } from "../src/services/vocabularyPrefetch";

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

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({
    courseId: "TOEIC",
    day: "1",
    quizType: "multiple-choice",
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
  GameBoard: ({
    courseColor,
    currentQuestion,
  }: {
    courseColor?: string;
    currentQuestion?: { word?: string };
  }) => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Text, View } = jest.requireActual("react-native");
    return ReactModule.createElement(
      View,
      null,
      ReactModule.createElement(Text, null, courseColor ?? "no-color"),
      ReactModule.createElement(Text, null, currentQuestion?.word ?? "no-word"),
    );
  },
  QuizFinishView: () => null,
  QuizTimer: () => null,
}));

jest.mock("../components/common/QuizGenerationAnimation", () => ({
  QuizGenerationAnimation: () => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual("react-native");
    return ReactModule.createElement(Text, null, "Creating quizzes...");
  },
}));

describe("QuizPlayScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    __resetVocabularyPrefetchStateForTests();
    await AsyncStorage.clear();
  });

  it("renders without throwing and resolves courseColor from courseId", async () => {
    const screen = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(screen.getByText("#4ECDC4")).toBeTruthy();
    });
  });

  it("revalidates stale cached vocabulary on load", async () => {
    await AsyncStorage.setItem(
      "vocab_cache_v3:TOEIC-Day1",
      JSON.stringify({
        updatedAt: Date.now() - 1000 * 60 * 60 * 7,
        cards: [
          {
            id: "stale-1",
            word: "stale-alpha",
            meaning: "stale first",
            example: "stale alpha example",
            course: "TOEIC",
          },
          {
            id: "stale-2",
            word: "stale-beta",
            meaning: "stale second",
            example: "stale beta example",
            course: "TOEIC",
          },
          {
            id: "stale-3",
            word: "stale-gamma",
            meaning: "stale third",
            example: "stale gamma example",
            course: "TOEIC",
          },
          {
            id: "stale-4",
            word: "stale-delta",
            meaning: "stale fourth",
            example: "stale delta example",
            course: "TOEIC",
          },
        ],
      }),
    );

    const { getByText } = render(<QuizPlayScreen />);

    await waitFor(() => {
      expect(getByText("#4ECDC4")).toBeTruthy();
    });

    await waitFor(() => {
      expect(
        getByText(
          /stale-alpha|stale-beta|stale-gamma|stale-delta/,
        ),
      ).toBeTruthy();
    });

    await waitFor(() => {
      const { getDocs } = jest.requireMock("firebase/firestore");
      expect(getDocs).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the generation animation while preparing the first quiz", async () => {
    jest.useFakeTimers();

    const deferredCards = createDeferred<any[]>();
    const prefetchSpy = jest
      .spyOn(vocabularyPrefetch, "prefetchVocabularyCards")
      .mockReturnValueOnce(deferredCards.promise as Promise<any>);

    const screen = render(<QuizPlayScreen />);

    expect(screen.getByText("Creating quizzes...")).toBeTruthy();

    await act(async () => {
      deferredCards.resolve([
        {
          id: "alpha-1",
          word: "alpha",
          meaning: "first",
          pronunciation: "alpha",
          example: "Alpha example",
          translation: "첫 번째",
          course: "TOEIC",
        },
        {
          id: "beta-1",
          word: "beta",
          meaning: "second",
          pronunciation: "beta",
          example: "Beta example",
          translation: "두 번째",
          course: "TOEIC",
        },
        {
          id: "gamma-1",
          word: "gamma",
          meaning: "third",
          pronunciation: "gamma",
          example: "Gamma example",
          translation: "세 번째",
          course: "TOEIC",
        },
        {
          id: "delta-1",
          word: "delta",
          meaning: "fourth",
          pronunciation: "delta",
          example: "Delta example",
          translation: "네 번째",
          course: "TOEIC",
        },
      ]);
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(499);
    });

    expect(screen.getByText("Creating quizzes...")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(screen.getByText("#4ECDC4")).toBeTruthy();
    });

    expect(prefetchSpy).toHaveBeenCalledWith("TOEIC", 1);
  });
});
