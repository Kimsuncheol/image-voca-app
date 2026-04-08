import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import VocabularyScreen from "../app/course/[courseId]/vocabulary";

const mockBufferWordLearned = jest.fn();
const mockFlushWordStats = jest.fn(async () => undefined);
const mockUpdateCourseDayProgress = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockUpsertVocabularyDayStudyHistory = jest.fn(async () => undefined);
const mockUpdateDoc = jest.fn(async () => undefined);
const mockGetDoc = jest.fn(async () => ({
  exists: () => false,
}));

const mockCards = [
  {
    id: "word-1",
    word: "abandon",
    meaning: "leave",
    example: "They abandon the idea.",
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
    replace: jest.fn(),
    push: jest.fn(),
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
      if (key === "course.dayTitle") {
        return `Day ${options?.day}`;
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

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mock-doc-ref"),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  fetchVocabularyCards: jest.fn(async () => mockCards),
  getCachedVocabularyCards: jest.fn(() => mockCards),
  hydrateVocabularyCache: jest.fn(async () => mockCards),
  isVocabularyCacheFresh: jest.fn(() => true),
}));

jest.mock("../src/services/dailyStudyHistory", () => ({
  upsertVocabularyDayStudyHistory: (...args: unknown[]) =>
    mockUpsertVocabularyDayStudyHistory(...args),
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
  VocabularyEmptyState: () => {
    const { Text } = require("react-native");
    return <Text>No words found for this day.</Text>;
  },
}));

jest.mock("../components/course/vocabulary/VocabularyFinishView", () => ({
  VocabularyFinishView: () => {
    const { Text } = require("react-native");
    return <Text>Finish View</Text>;
  },
}));

jest.mock("../components/course/vocabulary/VocabularySwipeDeck", () => ({
  VocabularySwipeDeck: ({
    cards,
    onSwipeRight,
    onFinish,
  }: {
    cards: Array<{ id: string; word: string; meaning: string; example: string; course: string }>;
    onSwipeRight: (item: { id: string; word: string; meaning: string; example: string; course: string }) => void;
    onFinish: () => void;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");

    return (
      <View>
        <TouchableOpacity
          onPress={() => {
            onSwipeRight(cards[0]);
            onFinish();
          }}
        >
          <Text>Swipe Right Then Finish</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe("VocabularyScreen completion persistence", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("persists the same learned count to course progress and daily history when finish follows the last learn immediately", async () => {
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Swipe Right Then Finish")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Swipe Right Then Finish"));

    await waitFor(() => {
      expect(mockFlushWordStats).toHaveBeenCalledWith("user-1");
    });

    expect(mockBufferWordLearned).toHaveBeenCalledWith("user-1", "TOEIC-word-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", {
      "courseProgress.TOEIC.1.completed": true,
      "courseProgress.TOEIC.1.totalWords": 1,
      "courseProgress.TOEIC.1.wordsLearned": 1,
    });
    expect(mockUpdateCourseDayProgress).toHaveBeenCalledWith("TOEIC", 1, {
      completed: true,
      totalWords: 1,
      wordsLearned: 1,
    });
    expect(mockUpsertVocabularyDayStudyHistory).toHaveBeenCalledWith({
      userId: "user-1",
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      entry: expect.objectContaining({
        courseId: "TOEIC",
        dayNumber: 1,
        wordsLearned: 1,
        totalWords: 1,
      }),
    });
  });
});
