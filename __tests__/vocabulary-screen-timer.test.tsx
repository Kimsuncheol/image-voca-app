import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import VocabularyScreen from "../app/course/[courseId]/vocabulary";
import type { CourseType, CourseVocabularyCard } from "../src/types/vocabulary";

const mockBufferWordLearned = jest.fn();
const mockFlushWordStats = jest.fn();
const mockUpdateCourseDayProgress = jest.fn();
const mockFetchCourseProgress = jest.fn();
const mockPush = jest.fn();
const mockDismissTo = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockNavigationAddListener = jest.fn();
const mockStackScreen: jest.Mock = jest.fn(() => null);
const mockHandleSpeech = jest.fn(async () => undefined);
const mockGetResumeProgress: jest.Mock = jest.fn(async () => null);
const mockSaveResumeProgress: jest.Mock = jest.fn(async () => null);
const mockClearResumeProgress: jest.Mock = jest.fn(async () => undefined);
const mockUpdateDoc: jest.Mock = jest.fn(async () => undefined);
const mockLanguageHeaderButton = jest.fn(
  ({
    showJapaneseKoreanOption,
  }: {
    showJapaneseKoreanOption?: boolean;
  }) => {
    const { Text } = require("react-native");
    return (
      <Text testID="language-header-button">
        {showJapaneseKoreanOption ? "japanese-korean" : "language"}
      </Text>
    );
  },
);
let mockUser: { uid: string } | null = null;
let mockCourseProgress: Record<string, Record<number, { completed?: boolean }>> =
  {};
let mockPreviewParam: string | undefined;
let mockCourseId: CourseType = "TOEIC";
let mockVocabularyPreferences = {
  autoSpeakVocabulary: true,
  reviewMaskTarget: "word-pronunciation" as const,
};

const cards: CourseVocabularyCard[] = [
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
let mockCards: CourseVocabularyCard[] = cards;

jest.mock("@/src/hooks/useStudyMode", () => {
  const React = require("react");

  return {
    StudyModeProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useStudySpeech: () => ({
      handleSpeech: mockHandleSpeech,
      lowVolumeHint: null,
      clearLowVolumeHint: jest.fn(),
    }),
  };
});

jest.mock("../src/hooks/useSpeechPreferences", () => ({
  useSpeechPreferences: () => ({
    vocabularyPreferences: mockVocabularyPreferences,
    isLoading: false,
  }),
}));

jest.mock("expo-router", () => ({
  Stack: {
    Screen: (props: { options?: { headerRight?: () => React.ReactNode } }) => {
      mockStackScreen(props);
      const HeaderRight = props.options?.headerRight;
      return HeaderRight ? <HeaderRight /> : null;
    },
  },
  useLocalSearchParams: () => ({
    courseId: mockCourseId,
    day: "1",
    preview: mockPreviewParam,
  }),
  useRouter: () => ({
    push: mockPush,
    dismissTo: mockDismissTo,
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
    i18n: { language: "en" },
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
      if (key === "course.review") {
        return "Review";
      }
      if (key === "course.mask") {
        return "Mask";
      }
      if (key === "course.show") {
        return "Show";
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

jest.mock("../src/components/common/LanguageHeaderButton", () => ({
  LanguageHeaderButton: (props: { showJapaneseKoreanOption?: boolean }) =>
    mockLanguageHeaderButton(props),
}));

jest.mock("../components/course/vocabulary/VocabularyEmptyState", () => ({
  VocabularyEmptyState: () => {
    const { Text } = require("react-native");
    return <Text>No words found for this day.</Text>;
  },
}));

jest.mock("../components/course/vocabulary/VocabularyFinishView", () => ({
  VocabularyFinishView: ({ onDays }: { onDays: () => void }) => {
    const { Text, TouchableOpacity, View } = require("react-native");
    return (
      <View>
        <Text>Finish View</Text>
        <TouchableOpacity onPress={onDays}>
          <Text>Finish Button</Text>
        </TouchableOpacity>
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
    isReviewMode,
    onMaskChange,
  }: {
    onIndexChange: (index: number) => void;
    onFinish: () => void;
    initialIndex: number;
    isPreviewMode?: boolean;
    isReviewMode?: boolean;
    onMaskChange?: (enabled: boolean) => void;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");

    return (
      <View>
        <Text>Vocabulary Deck</Text>
        <Text>{`Initial Index ${initialIndex}`}</Text>
        <Text>{`Preview Mode ${isPreviewMode ? "on" : "off"}`}</Text>
        <Text>{`Mask Mode ${isReviewMode ? "on" : "off"}`}</Text>
        <TouchableOpacity onPress={() => onMaskChange?.(false)}>
          <Text>Show Mask</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMaskChange?.(true)}>
          <Text>Mask Words</Text>
        </TouchableOpacity>
    <TouchableOpacity onPress={() => onIndexChange(1)}>
          <Text>Advance Deck</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onIndexChange(0)}>
          <Text>Previous Deck</Text>
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
  let consoleErrorSpy: jest.SpyInstance;
  let beforeRemoveHandler:
    | ((event: { preventDefault: jest.Mock; data: { action: object } }) => void)
    | undefined;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCards = cards;
    mockUser = null;
    mockCourseId = "TOEIC";
    mockVocabularyPreferences = {
      autoSpeakVocabulary: false,
      reviewMaskTarget: "word-pronunciation",
    };
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

  it("renders the language button between the day badge and eye comfort button", async () => {
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("eye-comfort-header-button")).toBeTruthy();
      expect(screen.getByTestId("language-header-button")).toBeTruthy();
      expect(screen.getByText("Day 1")).toBeTruthy();
    });

    const headerChildren = React.Children.toArray(
      screen.getByTestId("vocabulary-header-right").props.children,
    );

    expect(headerChildren).toHaveLength(3);
    expect(
      (headerChildren[1] as React.ReactElement).props
        .showJapaneseKoreanOption,
    ).toBe(false);
    expect(mockLanguageHeaderButton).toHaveBeenCalledWith({
      showJapaneseKoreanOption: false,
    });
  });

  it("enables the Japanese Korean shortcut for JLPT vocabulary headers", async () => {
    mockCourseId = "JLPT_N5";
    mockCards = [
      {
        id: "jlpt-1",
        word: "間",
        meaning: "interval",
        pronunciation: "あいだ",
        example: "駅とホテルの間",
        course: "JLPT_N5",
      },
    ];

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("language-header-button").props.children)
        .toBe("japanese-korean");
    });
    expect(mockLanguageHeaderButton).toHaveBeenCalledWith({
      showJapaneseKoreanOption: true,
    });
  });

  it("enables the Japanese Korean shortcut for Kanji vocabulary headers", async () => {
    mockCourseId = "KANJI";
    mockCards = [
      {
        id: "kanji-1",
        kanji: "語",
        meaning: ["word"],
        meaningKorean: ["단어"],
        meaningKoreanRomanize: ["dan-eo"],
        meaningExample: [{ items: [] }],
        meaningExampleHurigana: [{ items: [] }],
        meaningEnglishTranslation: [{ items: [] }],
        meaningKoreanTranslation: [{ items: [] }],
        reading: ["ご"],
        readingKorean: ["고"],
        readingKoreanRomanize: ["go"],
        readingExample: [{ items: [] }],
        readingExampleHurigana: [{ items: [] }],
        readingEnglishTranslation: [{ items: [] }],
        readingKoreanTranslation: [{ items: [] }],
        example: [],
        exampleEnglishTranslation: [],
        exampleKoreanTranslation: [],
        exampleHurigana: [],
      },
    ];

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("language-header-button").props.children)
        .toBe("japanese-korean");
    });
    expect(mockLanguageHeaderButton).toHaveBeenCalledWith({
      showJapaneseKoreanOption: true,
    });
  });

  it("automatically speaks the first vocabulary word when learning starts", async () => {
    mockVocabularyPreferences = {
      autoSpeakVocabulary: true,
      reviewMaskTarget: "word-pronunciation",
    };
    render(<VocabularyScreen />);

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalledWith("abandon", "EN", {
        language: "en-US",
      });
    });
  });

  it("automatically speaks next, previous, and revisited vocabulary words", async () => {
    mockVocabularyPreferences = {
      autoSpeakVocabulary: true,
      reviewMaskTarget: "word-pronunciation",
    };
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalledWith("abandon", "EN", {
        language: "en-US",
      });
    });
    mockHandleSpeech.mockClear();

    fireEvent.press(screen.getByText("Advance Deck"));

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalledWith("retain", "EN", {
        language: "en-US",
      });
    });
    mockHandleSpeech.mockClear();

    fireEvent.press(screen.getByText("Previous Deck"));

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalledWith("abandon", "EN", {
        language: "en-US",
      });
    });
  });

  it("automatically speaks JLPT pronunciation in Japanese", async () => {
    mockVocabularyPreferences = {
      autoSpeakVocabulary: true,
      reviewMaskTarget: "word-pronunciation",
    };
    mockCourseId = "JLPT_N5";
    mockCards = [
      {
        id: "jlpt-1",
        word: "間",
        meaning: "interval",
        pronunciation: "あいだ",
        example: "駅とホテルの間",
        course: "JLPT_N5",
      },
    ];

    render(<VocabularyScreen />);

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalledWith("あいだ", "JP");
    });
  });

  it("automatically speaks Kanji in Japanese", async () => {
    mockVocabularyPreferences = {
      autoSpeakVocabulary: true,
      reviewMaskTarget: "word-pronunciation",
    };
    mockCourseId = "KANJI";
    mockCards = [
      {
        id: "kanji-1",
        kanji: "語",
        meaning: ["word"],
        meaningKorean: ["단어"],
        meaningKoreanRomanize: ["dan-eo"],
        meaningExample: [{ items: [] }],
        meaningExampleHurigana: [{ items: [] }],
        meaningEnglishTranslation: [{ items: [] }],
        meaningKoreanTranslation: [{ items: [] }],
        reading: ["ご"],
        readingKorean: ["고"],
        readingKoreanRomanize: ["go"],
        readingExample: [{ items: [] }],
        readingExampleHurigana: [{ items: [] }],
        readingEnglishTranslation: [{ items: [] }],
        readingKoreanTranslation: [{ items: [] }],
        example: [],
        exampleEnglishTranslation: [],
        exampleKoreanTranslation: [],
        exampleHurigana: [],
      },
    ];

    render(<VocabularyScreen />);

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalledWith("語", "JP");
    });
  });

  it("does not auto speak the completion page", async () => {
    mockVocabularyPreferences = {
      autoSpeakVocabulary: true,
      reviewMaskTarget: "word-pronunciation",
    };
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalled();
    });
    mockHandleSpeech.mockClear();

    fireEvent.press(screen.getByText("Finish Deck"));

    await waitFor(() => {
      expect(screen.getByText("Finish View")).toBeTruthy();
    });
    expect(mockHandleSpeech).not.toHaveBeenCalled();
  });

  it("waits for the resume choice before automatically speaking", async () => {
    mockVocabularyPreferences = {
      autoSpeakVocabulary: true,
      reviewMaskTarget: "word-pronunciation",
    };
    mockUser = { uid: "user-1" };
    mockGetResumeProgress.mockResolvedValue({
      courseId: "TOEIC",
      dayNumber: 1,
      currentIndex: 1,
      cardId: "word-2",
      updatedAt: "2026-04-27T00:00:00.000Z",
    });

    render(<VocabularyScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Continue where you left off?",
        "Resume message",
        expect.any(Array),
      );
    });

    expect(mockHandleSpeech).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];
    act(() => {
      buttons.find((button) => button.text === "Continue")?.onPress?.();
    });

    await waitFor(() => {
      expect(mockHandleSpeech).toHaveBeenCalledWith("retain", "EN", {
        language: "en-US",
      });
    });
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

  it("defaults to shown learning while normal progress remains active", async () => {
    mockUser = { uid: "user-1" };

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Mask Mode off")).toBeTruthy();
      expect(screen.getByText("Initial Index 0")).toBeTruthy();
      expect(mockFetchCourseProgress).toHaveBeenCalledWith("user-1", "TOEIC");
      expect(mockGetResumeProgress).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText("Mask Words"));

    await waitFor(() => {
      expect(screen.getByText("Mask Mode on")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Advance Deck"));

    await waitFor(() => {
      expect(screen.getByText("Mask Mode off")).toBeTruthy();
      expect(mockSaveResumeProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentIndex: 1,
          courseId: "TOEIC",
          dayNumber: 1,
        }),
      );
      expect(mockBufferWordLearned).toHaveBeenCalledWith(
        "user-1",
        "TOEIC-word-2",
      );
    });

    fireEvent.press(screen.getByText("Finish Deck"));

    await waitFor(() => {
      expect(screen.getByText("Finish View")).toBeTruthy();
      expect(mockFlushWordStats).toHaveBeenCalledWith("user-1");
      expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", {
        "courseProgress.TOEIC.1.completed": true,
        "courseProgress.TOEIC.1.totalWords": 2,
        "courseProgress.TOEIC.1.wordsLearned": 1,
      });
    });

    fireEvent.press(screen.getByText("Finish Button"));

    expect(mockDismissTo).toHaveBeenCalledWith({
      pathname: "/course/[courseId]/days",
      params: { courseId: "TOEIC" },
    });

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

  it("keeps mask mode when leave is cancelled and resets to show on confirmed leave", async () => {
    mockUser = { uid: "user-1" };

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Mask Mode off")).toBeTruthy();
      expect(beforeRemoveHandler).toBeDefined();
    });

    fireEvent.press(screen.getByText("Mask Words"));

    await waitFor(() => {
      expect(screen.getByText("Mask Mode on")).toBeTruthy();
    });

    const firstEvent = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };
    act(() => {
      beforeRemoveHandler?.(firstEvent);
    });

    expect(firstEvent.preventDefault).toHaveBeenCalled();

    const cancelCall = alertSpy.mock.calls.find(
      (call) => call[0] === "Leave this day?",
    );
    const cancelButtons = cancelCall?.[2] as {
      text: string;
      onPress?: () => void;
    }[];

    act(() => {
      cancelButtons.find((button) => button.text === "Cancel")?.onPress?.();
    });

    expect(screen.getByText("Mask Mode on")).toBeTruthy();
    expect(mockNavigationDispatch).not.toHaveBeenCalled();

    const secondEvent = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };
    act(() => {
      beforeRemoveHandler?.(secondEvent);
    });

    const leaveCall = alertSpy.mock.calls
      .slice()
      .reverse()
      .find((call) => call[0] === "Leave this day?");
    const leaveButtons = leaveCall?.[2] as {
      text: string;
      onPress?: () => void;
    }[];

    act(() => {
      leaveButtons.find((button) => button.text === "Leave")?.onPress?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Mask Mode off")).toBeTruthy();
      expect(mockNavigationDispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
    });
  });

  it("hides the header mask toggle for standard English routes", async () => {
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Mask Mode off")).toBeTruthy();
    });

    expect(screen.queryByText("Mask")).toBeNull();
    expect(screen.queryByText("Show")).toBeNull();
  });

  it("hides the header mask toggle for JLPT routes", async () => {
    mockCourseId = "JLPT_N5";
    mockCards = cards.map((card) => ({ ...card, course: "JLPT_N5" }));

    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Mask Mode off")).toBeTruthy();
    });

    expect(screen.queryByText("Mask")).toBeNull();
    expect(screen.queryByText("Show")).toBeNull();
  });

  it.each(["COLLOCATION", "KANJI"])(
    "hides the header mask toggle for %s routes",
    async (courseId) => {
      mockCourseId = courseId as CourseType;
      mockCards = cards.map((card) => ({
        ...card,
        course: courseId as CourseType,
      }));

      const screen = render(<VocabularyScreen />);

      await waitFor(() => {
        expect(screen.getByText("Mask Mode off")).toBeTruthy();
      });

      expect(screen.queryByText("Mask")).toBeNull();
      expect(screen.queryByText("Show")).toBeNull();
    },
  );

  it("omits the finish-view review action and returns days without mode", async () => {
    const screen = render(<VocabularyScreen />);

    await waitFor(() => {
      expect(screen.getByText("Finish Deck")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Finish Deck"));

    await waitFor(() => {
      expect(screen.getByText("Finish View")).toBeTruthy();
    });

    expect(screen.queryByText("Review Button")).toBeNull();

    fireEvent.press(screen.getByText("Finish Button"));

    expect(mockDismissTo).toHaveBeenCalledWith({
      pathname: "/course/[courseId]/days",
      params: { courseId: "TOEIC" },
    });
  });


});
