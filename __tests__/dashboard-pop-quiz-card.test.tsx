import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { DashboardPopQuizCard } from "../components/dashboard/DashboardPopQuizCard";
import { fetchPopQuizMatchingGamesBatch } from "../src/services/popQuizService";

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = jest.requireActual<typeof import("react")>("react");
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) => {
      if (key === "dashboard.popQuiz.unavailable.missingData") {
        return `missing ${String(values?.course)} day ${String(values?.day)}`;
      }
      if (typeof values?.defaultValue === "string") {
        return values.defaultValue;
      }
      if (!values) return key;
      return Object.entries(values).reduce(
        (text, [name, value]) => text.replace(`{{${name}}}`, String(value)),
        key,
      );
    },
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, ...props }: any) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "user-1" } }),
}));

const learningLanguageState = {
  learningLanguage: "en" as "en" | "ja",
  recentCourseByLanguage: { en: "TOEIC" },
};

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => learningLanguageState,
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

const mockFetchCourseProgress = jest.fn();

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    courseProgress: {
      TOEIC: {
        1: { completed: true },
        2: { completed: false },
      },
    },
    fetchCourseProgress: mockFetchCourseProgress,
  }),
}));

jest.mock("../src/services/popQuizService", () => ({
  fetchPopQuizMatchingGamesBatch: jest.fn(),
}));

const popQuizGame = {
  quiz_type: "matching" as const,
  language: "english" as const,
  course: "TOEIC",
  level: null,
  day: 2,
  items: [
    { id: "q1", word: "duplicate" },
    { id: "q2", word: "duplicate" },
  ],
  choices: [
    { id: "c1", text: "same text" },
    { id: "c2", text: "same text" },
  ],
  answer_key: [
    { item_id: "q1", choice_id: "c1" },
    { item_id: "q2", choice_id: "c2" },
  ],
};

const pagedPopQuizGame = {
  ...popQuizGame,
  items: Array.from({ length: 6 }, (_, index) => ({
    id: `q${index + 1}`,
    word: `word ${index + 1}`,
  })),
  choices: Array.from({ length: 6 }, (_, index) => ({
    id: `c${index + 1}`,
    text: `meaning ${index + 1}`,
  })),
  answer_key: Array.from({ length: 6 }, (_, index) => ({
    item_id: `q${index + 1}`,
    choice_id: `c${index + 1}`,
  })),
};

const buildPopQuizGame = (day: number, count: number) => ({
  ...popQuizGame,
  day,
  items: Array.from({ length: count }, (_, index) => ({
    id: `d${day}-q${index + 1}`,
    word: `day ${day} word ${index + 1}`,
  })),
  choices: Array.from({ length: count }, (_, index) => ({
    id: `d${day}-c${index + 1}`,
    text: `day ${day} meaning ${index + 1}`,
  })),
  answer_key: Array.from({ length: count }, (_, index) => ({
    item_id: `d${day}-q${index + 1}`,
    choice_id: `d${day}-c${index + 1}`,
  })),
});

const completePagedGame = async (
  screen: ReturnType<typeof render>,
  day: number,
  count: number,
) => {
  for (let index = 1; index <= count; index += 1) {
    fireEvent.press(screen.getByTestId(`pop-quiz-item-d${day}-q${index}`));
    fireEvent.press(screen.getByTestId(`pop-quiz-choice-d${day}-c${index}`));

    if (index % 5 === 0 && index < count) {
      await act(async () => {
        jest.advanceTimersByTime(250);
      });
    }
  }
};

describe("DashboardPopQuizCard", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    learningLanguageState.learningLanguage = "en";
    learningLanguageState.recentCourseByLanguage = { en: "TOEIC" };
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValue({
      2: { game: popQuizGame },
      3: { game: null, reason: "missing-day" },
    });
  });

  it("renders a shimmer skeleton instead of loading text while pop quiz data loads", () => {
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockReturnValue(
      new Promise(() => {}),
    );

    const screen = render(<DashboardPopQuizCard />);

    expect(screen.getByText("dashboard.popQuiz.title")).toBeTruthy();
    expect(screen.getByTestId("pop-quiz-skeleton")).toBeTruthy();
    expect(screen.getByTestId("pop-quiz-skeleton-row-5")).toBeTruthy();
    expect(screen.getByTestId("pop-quiz-skeleton-left-1")).toBeTruthy();
    expect(screen.getByTestId("pop-quiz-skeleton-right-5")).toBeTruthy();
    expect(screen.queryByText("dashboard.popQuiz.loading")).toBeNull();
  });

  it("loads the first incomplete recent-course day and renders the game", async () => {
    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-item-q1")).toBeTruthy();
    });

    expect(mockFetchCourseProgress).toHaveBeenCalledWith("user-1", "TOEIC");
    expect(fetchPopQuizMatchingGamesBatch).toHaveBeenCalledWith({
      language: "en",
      course: "TOEIC",
      days: [2, 3],
      appLanguage: "en",
    });
    expect(screen.getByText("dashboard.popQuiz.title")).toBeTruthy();
  });

  it("renders vocabulary prompts on the left and meanings on the right", async () => {
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValue({
      2: { game: {
        ...popQuizGame,
        items: [
          { id: "q1", word: "解決" },
          { id: "q2", word: "目標を達成する" },
        ],
        choices: [
          { id: "c1", text: "solution" },
          { id: "c2", text: "achieve a goal" },
        ],
        answer_key: [
          { item_id: "q1", choice_id: "c1" },
          { item_id: "q2", choice_id: "c2" },
        ],
      } },
      3: { game: null, reason: "missing-day" },
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-item-q1")).toBeTruthy();
    });

    expect(screen.getByTestId("pop-quiz-item-q1")).toHaveTextContent("解決");
    expect(screen.getByTestId("pop-quiz-item-q2")).toHaveTextContent(
      "目標を達成する",
    );
    expect(screen.getByTestId("pop-quiz-choice-c1")).toHaveTextContent(
      "solution",
    );
    expect(screen.getByTestId("pop-quiz-choice-c2")).toHaveTextContent(
      "achieve a goal",
    );
    expect(screen.getByTestId("pop-quiz-choice-c1-text")).toHaveStyle({
      color: "#1f2937",
      fontSize: 13,
      fontWeight: "500",
    });
  });

  it("formats CSAT idiom titles and all numbered meanings visually", async () => {
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValue({
      2: { game: {
        ...popQuizGame,
        course: "CSAT_IDIOMS",
        items: [
          {
            id: "q1",
            word: "in order to v [so as to v]",
          },
          {
            id: "q2",
            word: "A / B",
          },
          {
            id: "q3",
            word: "for example[instance]",
          },
        ],
        choices: [
          {
            id: "c1",
            text: "1. first 2. second 3. third",
          },
          {
            id: "c2",
            text: "A or B",
          },
          {
            id: "c3",
            text: "as an example",
          },
        ],
        answer_key: [
          { item_id: "q1", choice_id: "c1" },
          { item_id: "q2", choice_id: "c2" },
          { item_id: "q3", choice_id: "c3" },
        ],
      } },
      3: { game: null, reason: "missing-day" },
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-choice-c1")).toBeTruthy();
    });

    expect(screen.getByTestId("pop-quiz-item-q1")).toHaveTextContent(
      "in order to v\n[so as to v]",
    );
    expect(screen.getByTestId("pop-quiz-item-q2")).toHaveTextContent("A\n/ B");
    expect(screen.getByTestId("pop-quiz-item-q3")).toHaveTextContent(
      "for example[instance]",
    );
    expect(screen.getByTestId("pop-quiz-choice-c1")).toHaveTextContent(
      "1. first\n2. second\n3. third",
    );
    expect(screen.getByTestId("pop-quiz-choice-c1-text").props.numberOfLines)
      .toBeUndefined();
  });

  it("leaves non-idiom numbered titles and meanings unchanged", async () => {
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValue({
      2: { game: {
        ...popQuizGame,
        course: "TOEIC",
        items: [
          {
            id: "q1",
            word: "in order to v [so as to v]",
          },
        ],
        choices: [
          {
            id: "c1",
            text: "1. first 2. second 3. third",
          },
        ],
        answer_key: [{ item_id: "q1", choice_id: "c1" }],
      } },
      3: { game: null, reason: "missing-day" },
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-choice-c1")).toBeTruthy();
    });

    expect(screen.getByTestId("pop-quiz-item-q1")).toHaveTextContent(
      "in order to v [so as to v]",
    );
    expect(screen.getByTestId("pop-quiz-choice-c1")).toHaveTextContent(
      "1. first 2. second 3. third",
    );
  });

  it("uses flexible tile font sizes for long vocabulary and meaning text", async () => {
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValue({
      2: { game: {
        ...popQuizGame,
        items: [
          {
            id: "q1",
            word: "make a difficult decision under intense pressure",
          },
        ],
        choices: [
          {
            id: "c1",
            text: "1. extremely busy with many urgent tasks 2. needing any possible help 3. overwhelmed",
          },
        ],
        answer_key: [{ item_id: "q1", choice_id: "c1" }],
      } },
      3: { game: null, reason: "missing-day" },
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-item-q1-text")).toBeTruthy();
    });

    expect(screen.getByTestId("pop-quiz-item-q1-text")).toHaveStyle({
      fontSize: 14,
      lineHeight: 18,
    });
    expect(screen.getByTestId("pop-quiz-choice-c1-text")).toHaveStyle({
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "500",
    });
  });

  it("overrides neutral meaning color when a choice is selected", async () => {
    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-choice-c1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("pop-quiz-choice-c1"));

    expect(screen.getByTestId("pop-quiz-choice-c1-text")).toHaveStyle({
      color: "#4ECDC4",
    });
  });

  it("hides chrome controls and auto-advances after a page is matched", async () => {
    jest.useFakeTimers();
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValue({
      2: { game: pagedPopQuizGame },
      3: { game: null, reason: "missing-day" },
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-item-q1")).toBeTruthy();
    });

    expect(screen.queryByText("dashboard.popQuiz.subtitle")).toBeNull();
    expect(screen.queryByText("dashboard.popQuiz.progress")).toBeNull();
    expect(screen.queryByText("dashboard.popQuiz.wrongAttempts")).toBeNull();
    expect(screen.queryByText("dashboard.popQuiz.elapsed")).toBeNull();
    expect(screen.queryByTestId("pop-quiz-reset")).toBeNull();
    expect(screen.queryByTestId("pop-quiz-previous-page")).toBeNull();
    expect(screen.queryByTestId("pop-quiz-next-page")).toBeNull();
    expect(screen.queryByTestId("pop-quiz-page-indicator")).toBeNull();
    expect(screen.getByTestId("pop-quiz-item-q5")).toBeTruthy();
    expect(screen.getByTestId("pop-quiz-choice-c5")).toBeTruthy();
    expect(screen.queryByTestId("pop-quiz-item-q6")).toBeNull();
    expect(screen.queryByTestId("pop-quiz-choice-c6")).toBeNull();

    for (let index = 1; index <= 5; index += 1) {
      fireEvent.press(screen.getByTestId(`pop-quiz-item-q${index}`));
      fireEvent.press(screen.getByTestId(`pop-quiz-choice-c${index}`));
    }

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.queryByTestId("pop-quiz-item-q1")).toBeNull();
    expect(screen.getByTestId("pop-quiz-item-q6")).toBeTruthy();
    expect(screen.getByTestId("pop-quiz-choice-c6")).toBeTruthy();

    fireEvent.press(screen.getByTestId("pop-quiz-item-q6"));
    fireEvent.press(screen.getByTestId("pop-quiz-choice-c6"));
    expect(screen.queryByTestId("pop-quiz-completed")).toBeNull();
    expect(screen.getByTestId("pop-quiz-item-q6")).toHaveStyle({
      borderColor: "#34C759",
    });
    expect(screen.getByTestId("pop-quiz-choice-c6")).toHaveStyle({
      borderColor: "#34C759",
    });
  });

  it("shows a friendly unavailable state instead of crashing", async () => {
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValue({
      2: { game: null, reason: "missing-day" },
      3: { game: null, reason: "missing-day" },
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.popQuiz.unavailable.title")).toBeTruthy();
    });
    expect(screen.getByText("missing TOEIC day 2")).toBeTruthy();
  });

  it("loads the prefetched next day after completing all pairs", async () => {
    jest.useFakeTimers();
    const day2Game = buildPopQuizGame(2, 20);
    const day3Game = buildPopQuizGame(3, 20);
    (fetchPopQuizMatchingGamesBatch as jest.Mock)
      .mockResolvedValueOnce({
        2: { game: day2Game },
        3: { game: day3Game },
      })
      .mockResolvedValueOnce({
        4: { game: null, reason: "missing-day" },
      });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-item-d2-q1")).toBeTruthy();
    });

    await completePagedGame(screen, 2, 20);

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.queryByTestId("pop-quiz-item-d2-q16")).toBeNull();
    expect(screen.getByTestId("pop-quiz-item-d3-q1")).toBeTruthy();
    expect(screen.getByTestId("pop-quiz-choice-d3-c1")).toBeTruthy();
    await waitFor(() => {
      expect(fetchPopQuizMatchingGamesBatch).toHaveBeenCalledWith({
        language: "en",
        course: "TOEIC",
        days: [4],
        appLanguage: "en",
      });
    });
  });

  it("shows unavailable state when the next day is missing after completion", async () => {
    jest.useFakeTimers();
    const day2Game = buildPopQuizGame(2, 20);
    (fetchPopQuizMatchingGamesBatch as jest.Mock).mockResolvedValueOnce({
      2: { game: day2Game },
      3: { game: null, reason: "missing-day" },
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-item-d2-q1")).toBeTruthy();
    });

    await completePagedGame(screen, 2, 20);

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.queryByTestId("pop-quiz-item-d2-q16")).toBeNull();
    expect(screen.getByText("dashboard.popQuiz.unavailable.title")).toBeTruthy();
    expect(screen.getByText("missing TOEIC day 3")).toBeTruthy();
  });

  it("uses answer ids rather than display text and completes after correct pairs", async () => {
    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-choice-c2")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("pop-quiz-item-q1"));
    fireEvent.press(screen.getByTestId("pop-quiz-choice-c2"));

    expect(screen.queryByTestId("pop-quiz-completed")).toBeNull();
    expect(screen.getByTestId("pop-quiz-choice-c2-text")).toHaveStyle({
      color: "#FF3B30",
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 750));
    });

    fireEvent.press(screen.getByTestId("pop-quiz-item-q1"));
    expect(screen.getByTestId("pop-quiz-item-q1-text")).toHaveStyle({
      color: "#4ECDC4",
    });
    fireEvent.press(screen.getByTestId("pop-quiz-choice-c1"));
    fireEvent.press(screen.getByTestId("pop-quiz-item-q2"));
    fireEvent.press(screen.getByTestId("pop-quiz-choice-c2"));

    expect(screen.queryByTestId("pop-quiz-completed")).toBeNull();
    expect(screen.getByTestId("pop-quiz-item-q2")).toHaveStyle({
      borderColor: "#34C759",
    });
    expect(screen.getByTestId("pop-quiz-choice-c2")).toHaveStyle({
      borderColor: "#34C759",
    });
    expect(screen.getByTestId("pop-quiz-choice-c2-text")).toHaveStyle({
      color: "#34C759",
    });
  });

  it("keeps wrong choices visible", async () => {
    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-choice-c2")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("pop-quiz-item-q1"));
    fireEvent.press(screen.getByTestId("pop-quiz-choice-c2"));

    expect(screen.getByTestId("pop-quiz-choice-c2")).toBeTruthy();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 750));
    });
  });
});
