import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import VocabularyScreen from "../app/course/[courseId]/vocabulary";

const mockBufferWordLearned = jest.fn();
const mockFlushWordStats = jest.fn();
const mockUpdateCourseDayProgress = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockNavigationAddListener = jest.fn();
const mockStackScreen: jest.Mock = jest.fn(() => null);
const mockGetResumeProgress: jest.Mock = jest.fn(async () => null);
const mockSaveResumeProgress: jest.Mock = jest.fn(async () => null);
const mockClearResumeProgress: jest.Mock = jest.fn(async () => undefined);
const mockUpdateDoc: jest.Mock = jest.fn(async () => undefined);
let mockUser: { uid: string } | null = null;
let mockCourseProgress: Record<string, Record<number, { completed?: boolean }>> =
  {};
let mockPreviewParam: string | undefined;

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
let mockCards = cards;

jest.mock("expo-router", () => ({
  Stack: {
    Screen: (props: unknown) => mockStackScreen(props),
  },
  useLocalSearchParams: () => ({
    courseId: "TOEIC",
    day: "1",
    preview: mockPreviewParam,
  }),
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useNavigation: () => ({
    addListener: mockNavigationAddListener,
    dispatch: mockNavigationDispatch,
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
      if (key === "common.cancel") {
        return "Cancel";
      }
      if (key === "course.resume.leaveTitle") {
        return "Leave this day?";
      }
      if (key === "course.resume.leaveMessage") {
        return "Your current word will be saved.";
      }
      if (key === "course.resume.leave") {
        return "Leave";
      }
      if (key === "course.resume.resumeTitle") {
        return "Continue where you left off?";
      }
      if (key === "course.resume.resumeMessage") {
        return "Resume message";
      }
      if (key === "course.resume.continue") {
        return "Continue";
      }
      if (key === "course.resume.startOver") {
        return "Start Over";
      }
      if (key === "course.previewComplete") {
        return "Preview complete";
      }
      if (key === "course.previewReturn") {
        return "Back to days";
      }
      if (key === "course.preview") {
        return "Preview";
      }
      return key;
    },
  }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mock-doc-ref"),
  getDoc: jest.fn(async () => ({
    exists: () => false,
  })),
  updateDoc: (docRef: unknown, data: unknown) => mockUpdateDoc(docRef, data),
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

jest.mock("../src/services/vocabularyDayResume", () => ({
  getResumeProgress: (args: unknown) => mockGetResumeProgress(args),
  saveResumeProgress: (args: unknown) => mockSaveResumeProgress(args),
  clearResumeProgress: (args: unknown) => mockClearResumeProgress(args),
}));

jest.mock("../src/services/dailyStudyHistory", () => ({
  upsertVocabularyDayStudyHistory: jest.fn(async () => undefined),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: Object.assign(
    jest.fn(() => ({
      bufferWordLearned: mockBufferWordLearned,
      flushWordStats: mockFlushWordStats,
      updateCourseDayProgress: mockUpdateCourseDayProgress,
      courseProgress: mockCourseProgress,
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
    const { Text, View } = require("react-native");
    return (
      <View>
        <Text>Finish View</Text>

      </View>
    );
  },
}));

jest.mock("../components/course/vocabulary/VocabularySwipeDeck", () => ({
  VocabularySwipeDeck: ({
    onIndexChange,
    onFinish,
    initialIndex,
    isPreviewMode,
  }: {
    onIndexChange: (index: number) => void;
    onFinish: () => void;
    initialIndex: number;
    isPreviewMode?: boolean;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");

    return (
      <View>
        <Text>Vocabulary Deck</Text>
        <Text>{`Initial Index ${initialIndex}`}</Text>
        <Text>{`Preview Mode ${isPreviewMode ? "on" : "off"}`}</Text>
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

describe("VocabularyScreen deck state", () => {
  let alertSpy: jest.SpyInstance;
  let beforeRemoveHandler:
    | ((event: { preventDefault: jest.Mock; data: { action: object } }) => void)
    | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCards = cards;
    mockUser = null;
    mockCourseProgress = {};
    mockPreviewParam = undefined;
    mockFetchCourseProgress.mockResolvedValue(undefined);
    mockGetResumeProgress.mockResolvedValue(null);
    mockSaveResumeProgress.mockResolvedValue(null);
    mockClearResumeProgress.mockResolvedValue(undefined);
    beforeRemoveHandler = undefined;
    mockNavigationAddListener.mockImplementation((eventName, handler) => {
      if (eventName === "beforeRemove") {
        beforeRemoveHandler = handler;
      }
      return jest.fn();
    });
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("renders the deck when cards exist", async () => {
    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("Vocabulary Deck")).toBeTruthy();
  });

  it("matches the native header background to the screen background", async () => {
    render(<VocabularyScreen />);

    await waitFor(() => {
      expect(mockStackScreen).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#000",
          }),
        }),
      );
    });
  });

  it("top-aligns the active deck close to the header", async () => {
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Vocabulary Deck")).toBeTruthy();
    });

    const viewNodes = screen.UNSAFE_getAllByType(View);
    const hasTopAlignedDeckContainer = viewNodes.some((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return (
        style?.flex === 1 &&
        style?.width === "100%" &&
        style?.alignItems === "center" &&
        style?.justifyContent === "flex-start" &&
        style?.paddingTop == null
      );
    });

    expect(hasTopAlignedDeckContainer).toBe(true);
  });

  it("keeps the deck active when the index changes in the same session", async () => {
    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("Advance Deck")).toBeTruthy();

    fireEvent.press(screen.getByText("Advance Deck"));

    expect(screen.getByText("Vocabulary Deck")).toBeTruthy();
    expect(mockBufferWordLearned).not.toHaveBeenCalled();
  });

  it("renders the deck again when the screen remounts", async () => {
    const firstRender = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(firstRender.getByText("Vocabulary Deck")).toBeTruthy();

    firstRender.unmount();

    const secondRender = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(secondRender.getByText("Vocabulary Deck")).toBeTruthy();
  });

  it("hides the deck when the screen is in the empty state", async () => {
    mockCards = [];

    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("No words found for this day.")).toBeTruthy();
  });

  it("shows the finish view when the deck is finished", async () => {
    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("Finish Deck")).toBeTruthy();

    act(() => {
      fireEvent.press(screen.getByText("Finish Deck"));
    });

    await Promise.resolve();
    expect(screen.getByText("Finish View")).toBeTruthy();
  });

  it("prompts to continue from saved progress and applies the saved index", async () => {
    mockUser = { uid: "user-1" };
    mockGetResumeProgress.mockResolvedValue({
      courseId: "TOEIC",
      dayNumber: 1,
      currentIndex: 1,
      cardId: "word-2",
      updatedAt: "2026-04-27T00:00:00.000Z",
    });

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Continue where you left off?",
        "Resume message",
        expect.any(Array),
      );
    });

    const buttons = alertSpy.mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];
    act(() => {
      buttons.find((button) => button.text === "Continue")?.onPress?.();
    });

    expect(screen.getByText("Initial Index 1")).toBeTruthy();
  });

  it("starts from the beginning when saved progress is canceled", async () => {
    mockUser = { uid: "user-1" };
    mockGetResumeProgress.mockResolvedValue({
      courseId: "TOEIC",
      dayNumber: 1,
      currentIndex: 1,
      cardId: "word-2",
      updatedAt: "2026-04-27T00:00:00.000Z",
    });

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Continue where you left off?",
        "Resume message",
        expect.any(Array),
      );
    });

    const buttons = alertSpy.mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];
    act(() => {
      buttons.find((button) => button.text === "Start Over")?.onPress?.();
    });

    expect(screen.getByText("Initial Index 0")).toBeTruthy();
    await waitFor(() => {
      expect(mockClearResumeProgress).toHaveBeenCalledWith({
        userId: "user-1",
        courseId: "TOEIC",
        dayNumber: 1,
      });
    });
  });

  it("saves the current index before confirmed leave", async () => {
    mockUser = { uid: "user-1" };
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Advance Deck")).toBeTruthy();
      expect(beforeRemoveHandler).toBeDefined();
    });

    fireEvent.press(screen.getByText("Advance Deck"));

    const event = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };

    act(() => {
      beforeRemoveHandler?.(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Leave this day?",
      "Your current word will be saved.",
      expect.any(Array),
    );

    const leaveCall = alertSpy.mock.calls.find(
      (call) => call[0] === "Leave this day?",
    );
    const buttons = leaveCall?.[2] as {
      text: string;
      onPress?: () => void;
    }[];

    act(() => {
      buttons.find((button) => button.text === "Leave")?.onPress?.();
    });

    await waitFor(() => {
      expect(mockSaveResumeProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          currentIndex: 1,
          courseId: "TOEIC",
          dayNumber: 1,
        }),
      );
      expect(mockNavigationDispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
    });
  });

  it("shows leave confirmation on the first word without creating resumable progress", async () => {
    mockUser = { uid: "user-1" };
    render(<VocabularyScreen />);

    await waitFor(() => {
      expect(beforeRemoveHandler).toBeDefined();
    });

    const event = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };

    act(() => {
      beforeRemoveHandler?.(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Leave this day?",
      "Your current word will be saved.",
      expect.any(Array),
    );

    const leaveCall = alertSpy.mock.calls.find(
      (call) => call[0] === "Leave this day?",
    );
    const buttons = leaveCall?.[2] as {
      text: string;
      onPress?: () => void;
    }[];

    act(() => {
      buttons.find((button) => button.text === "Leave")?.onPress?.();
    });

    await waitFor(() => {
      expect(mockSaveResumeProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentIndex: 0,
          courseId: "TOEIC",
          dayNumber: 1,
        }),
      );
      expect(mockNavigationDispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
    });

    const secondRender = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(secondRender.getByText("Vocabulary Deck")).toBeTruthy();
    });

    expect(secondRender.getByText("Initial Index 0")).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalledWith(
      "Continue where you left off?",
      "Resume message",
      expect.any(Array),
    );
  });

  it("does not prompt for completed days and clears stale progress", async () => {
    mockUser = { uid: "user-1" };
    mockCourseProgress = { TOEIC: { 1: { completed: true } } };
    mockGetResumeProgress.mockResolvedValue({
      courseId: "TOEIC",
      dayNumber: 1,
      currentIndex: 1,
      cardId: "word-2",
      updatedAt: "2026-04-27T00:00:00.000Z",
    });

    render(<VocabularyScreen />);

    await waitFor(() => {
      expect(mockClearResumeProgress).toHaveBeenCalledWith({
        userId: "user-1",
        courseId: "TOEIC",
        dayNumber: 1,
      });
    });

    expect(mockGetResumeProgress).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("does not mount the deck when the empty state is shown", async () => {
    mockCards = [];

    const screen = render(<VocabularyScreen />);

    await Promise.resolve();
    await Promise.resolve();

    expect(screen.getByText("No words found for this day.")).toBeTruthy();
    expect(screen.queryByText("Vocabulary Deck")).toBeNull();
  });

  it("renders preview mode without progress, resume, or completion side effects", async () => {
    mockUser = { uid: "user-1" };
    mockPreviewParam = "1";

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Preview Mode on")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Advance Deck"));
    fireEvent.press(screen.getByText("Finish Deck"));

    await waitFor(() => {
      expect(screen.getByText("Preview complete")).toBeTruthy();
    });

    expect(mockGetResumeProgress).not.toHaveBeenCalled();
    expect(mockSaveResumeProgress).not.toHaveBeenCalled();
    expect(mockClearResumeProgress).not.toHaveBeenCalled();
    expect(mockBufferWordLearned).not.toHaveBeenCalled();
    expect(mockFlushWordStats).not.toHaveBeenCalled();
    expect(mockUpdateDoc).not.toHaveBeenCalled();

    const event = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };
    act(() => {
      beforeRemoveHandler?.(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });


});
