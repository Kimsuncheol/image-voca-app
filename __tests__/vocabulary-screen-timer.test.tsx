import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import VocabularyScreen from "../app/course/[courseId]/vocabulary";

const mockBufferWordLearned = jest.fn();
const mockFlushWordStats = jest.fn();
const mockUpdateCourseDayProgress = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

const cards = [
  {
    id: "word-1",
    word: "abandon",
    meaning: "leave",
    example: "They abandon the idea.",
    course: "TOEIC",
  },
  {
    id: "word-2",
    word: "retain",
    meaning: "keep",
    example: "Retain the record.",
    course: "TOEIC",
  },
];

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => ({
    courseId: "TOEIC",
    day: "1",
  }),
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
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
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "swipe.timer.label") {
        return "Study Time";
      }
      if (key === "course.dayTitle") {
        return `Day ${options?.day}`;
      }
      if (key === "course.checked") {
        return "Completed";
      }
      if (key === "course.takeQuiz") {
        return "Take Quiz";
      }
      if (key === "common.restart") {
        return "Restart";
      }
      if (key === "common.back") {
        return "Back";
      }
      return key;
    },
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
  getDoc: jest.fn(async () => ({
    exists: () => false,
  })),
  updateDoc: jest.fn(async () => undefined),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  fetchVocabularyCards: jest.fn(async () => cards),
  getCachedVocabularyCards: jest.fn(() => cards),
  hydrateVocabularyCache: jest.fn(async () => cards),
  isVocabularyCacheFresh: jest.fn(() => true),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: Object.assign(
    jest.fn(() => ({
      bufferWordLearned: mockBufferWordLearned,
      flushWordStats: mockFlushWordStats,
      updateCourseDayProgress: mockUpdateCourseDayProgress,
      courseProgress: {},
      fetchCourseProgress: mockFetchCourseProgress,
    })),
    {
      getState: () => ({
        stats: {
          currentStreak: 0,
        },
      }),
    },
  ),
}));

jest.mock("../components/common/AppSplashScreen", () => ({
  AppSplashScreen: () => null,
}));

jest.mock("../components/common/StreakMilestoneModal", () => ({
  StreakMilestoneModal: () => null,
}));

jest.mock("../components/course/vocabulary/VocabularyEmptyState", () => ({
  VocabularyEmptyState: () => null,
}));

jest.mock("../components/course/vocabulary/VocabularyFinishView", () => ({
  VocabularyFinishView: ({
    onManga,
  }: {
    onManga: () => void;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");
    return (
      <View>
        <Text>Finish View</Text>
        <TouchableOpacity onPress={onManga}>
          <Text>Read Manga</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock("../components/course/vocabulary/VocabularySwipeDeck", () => ({
  VocabularySwipeDeck: ({
    onIndexChange,
    onFinish,
  }: {
    onIndexChange: (index: number) => void;
    onFinish: () => void;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");

    return (
      <View>
        <Text>Vocabulary Deck</Text>
        <TouchableOpacity onPress={() => onIndexChange(1)}>
          <Text>Advance Deck</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onFinish}>
          <Text>Finish Deck</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe("VocabularyScreen stopwatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders the timer above the deck and advances over time", async () => {
    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("Vocabulary Deck")).toBeTruthy();
    expect(screen.getByText("Study Time")).toBeTruthy();
    expect(screen.getByTestId("swipe-study-timer-value").props.children).toBe("00:00");

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("swipe-study-timer-value").props.children).toBe("00:03");
  });

  it("does not reset the timer when the deck index changes in the same session", async () => {
    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("Advance Deck")).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.press(screen.getByText("Advance Deck"));

    expect(screen.getByTestId("swipe-study-timer-value").props.children).toBe("00:02");
    expect(mockBufferWordLearned).not.toHaveBeenCalled();
  });

  it("resets the timer when the screen remounts", async () => {
    const firstRender = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(firstRender.getByText("Vocabulary Deck")).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(firstRender.getByTestId("swipe-study-timer-value").props.children).toBe("00:04");

    firstRender.unmount();

    const secondRender = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(secondRender.getByText("Vocabulary Deck")).toBeTruthy();
    expect(secondRender.getByTestId("swipe-study-timer-value").props.children).toBe("00:00");
  });

  it("hides the timer when the finish view is shown", async () => {
    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("Finish Deck")).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    act(() => {
      fireEvent.press(screen.getByText("Finish Deck"));
    });

    await Promise.resolve();
    expect(screen.getByText("Finish View")).toBeTruthy();
    expect(screen.queryByText("Study Time")).toBeNull();
    expect(screen.queryByTestId("swipe-study-timer-value")).toBeNull();
  });

  it("navigates to the manga reader with courseId and day params", async () => {
    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    act(() => {
      fireEvent.press(screen.getByText("Finish Deck"));
    });

    await Promise.resolve();

    fireEvent.press(screen.getByText("Read Manga"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/manga/reader",
      params: {
        courseId: "TOEIC",
        day: "1",
      },
    });
  });
});
