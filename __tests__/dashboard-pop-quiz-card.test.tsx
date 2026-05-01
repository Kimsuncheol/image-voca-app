import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { DashboardPopQuizCard } from "../components/dashboard/DashboardPopQuizCard";
import { fetchPopQuizMatchingGame } from "../src/services/popQuizService";

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
  fetchPopQuizMatchingGame: jest.fn(),
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

describe("DashboardPopQuizCard", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    learningLanguageState.learningLanguage = "en";
    learningLanguageState.recentCourseByLanguage = { en: "TOEIC" };
    (fetchPopQuizMatchingGame as jest.Mock).mockResolvedValue({
      game: popQuizGame,
    });
  });

  it("loads the first incomplete recent-course day and renders the game", async () => {
    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-item-q1")).toBeTruthy();
    });

    expect(mockFetchCourseProgress).toHaveBeenCalledWith("user-1", "TOEIC");
    expect(fetchPopQuizMatchingGame).toHaveBeenCalledWith({
      language: "en",
      course: "TOEIC",
      day: 2,
      appLanguage: "en",
    });
    expect(screen.getByText("dashboard.popQuiz.title")).toBeTruthy();
  });

  it("renders vocabulary prompts on the left and meanings on the right", async () => {
    (fetchPopQuizMatchingGame as jest.Mock).mockResolvedValue({
      game: {
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
      },
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
  });

  it("hides chrome controls and auto-advances after a page is matched", async () => {
    jest.useFakeTimers();
    (fetchPopQuizMatchingGame as jest.Mock).mockResolvedValue({
      game: pagedPopQuizGame,
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
    (fetchPopQuizMatchingGame as jest.Mock).mockResolvedValue({
      game: null,
      reason: "missing-day",
    });

    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByText("dashboard.popQuiz.unavailable.title")).toBeTruthy();
    });
    expect(screen.getByText("dashboard.popQuiz.unavailable.missingData")).toBeTruthy();
  });

  it("uses answer ids rather than display text and completes after correct pairs", async () => {
    const screen = render(<DashboardPopQuizCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pop-quiz-choice-c2")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("pop-quiz-item-q1"));
    fireEvent.press(screen.getByTestId("pop-quiz-choice-c2"));

    expect(screen.queryByTestId("pop-quiz-completed")).toBeNull();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 750));
    });

    fireEvent.press(screen.getByTestId("pop-quiz-item-q1"));
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
