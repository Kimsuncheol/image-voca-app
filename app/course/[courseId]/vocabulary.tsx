import { FontWeights } from "@/constants/fontWeights";
import {
  StudyModeProvider,
  useStudySpeech,
} from "@/src/hooks/useStudyMode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  AppState,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Contexts & Service
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useSpeechPreferences } from "../../../src/hooks/useSpeechPreferences";
import { useJapaneseContentLanguage } from "../../../src/hooks/useJapaneseContentLanguage";
import { upsertVocabularyDayStudyHistory } from "../../../src/services/dailyStudyHistory";
import { db } from "../../../src/services/firebase";
import {
  clearResumeProgress,
  getResumeProgress,
  saveResumeProgress,
} from "../../../src/services/vocabularyDayResume";
import {
  fetchVocabularyCards,
  getCachedVocabularyCards,
  hydrateVocabularyCache,
  isVocabularyCacheFresh,
} from "../../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../../src/stores";
import {
  CourseType,
  CourseVocabularyCard,
  isJlptLevelCourseId,
  isKanjiWord,
} from "../../../src/types/vocabulary";
import { formatDateKey } from "../../../src/utils/calendarStats";
import { resolveVocabularyContent } from "../../../src/utils/localizedVocabulary";
import { stripReviewMaskDelimiters } from "../../../src/utils/reviewMasking";
import { speakWordVariants } from "../../../src/utils/wordVariants";

// Components
import { AppSplashScreen } from "../../../components/common/AppSplashScreen";
import { DayBadge } from "../../../components/common/DayBadge";
import { StreakMilestoneModal } from "../../../components/common/StreakMilestoneModal";
import { VocabularyEmptyState } from "../../../components/course/vocabulary/VocabularyEmptyState";
import { VocabularyFinishView } from "../../../components/course/vocabulary/VocabularyFinishView";
import { VocabularySwipeDeck } from "../../../components/course/vocabulary/VocabularySwipeDeck";
import { EyeComfortHeaderButton } from "../../../src/components/common/EyeComfortHeaderButton";
import { LanguageHeaderButton } from "../../../src/components/common/LanguageHeaderButton";

const { width } = Dimensions.get("window");

/**
 * Vocabulary Learning Screen
 *
 * This screen is the main interface for users to learn vocabulary words.
 * It presents a deck of cards that users can swipe through.
 *
 * Core Features:
 * 1. Data Fetching: Fetches vocabulary from Firestore with caching support.
 * 2. Progress Tracking: Updates user stats for words learned and daily progress.
 * 3. Word Bank Integration: Checks if words are saved in the user's Word Bank.
 * 4. Swipe Interface: Uses a tinder-like swipe deck for standard courses and a pager for collocations.
 */
export default function VocabularyScreen() {
  return (
    <StudyModeProvider keepAwakeTag="VocabularyStudyScreen" hideNavigationBar>
      <VocabularyScreenContent />
    </StudyModeProvider>
  );
}

function VocabularyScreenContent() {
  // ============================================================================
  // Section 1: Hooks & Contexts
  // ============================================================================
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const { user } = useAuth();

  // Zustand store actions for managing user statistics and progress
  const {
    bufferWordLearned,
    flushWordStats,
    updateCourseDayProgress,
    courseProgress,
    fetchCourseProgress,
  } = useUserStatsStore();


  // Navigation parameters: courseId (e.g., 'TOEIC') and day (e.g., '1')
  const { courseId, day, preview } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    preview?: string;
  }>();
  const typedCourseId = courseId as CourseType;
  const router = useRouter();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language ?? "en";
  const contentLanguage = useJapaneseContentLanguage(
    typedCourseId,
    currentLanguage,
  );
  const { handleSpeech } = useStudySpeech();
  const { vocabularyPreferences, isLoading: speechPreferencesLoading } =
    useSpeechPreferences();

  // ============================================================================
  // Section 2: State Management
  // ============================================================================

  // Tracks if the user has completed swiping through all cards
  const [isFinished, setIsFinished] = useState(false);
  const [initialDeckIndex, setInitialDeckIndex] = useState(0);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState(0);
  const [courseProgressLoaded, setCourseProgressLoaded] = useState(false);
  const [resumeProgressResolved, setResumeProgressResolved] = useState(false);

  // Track session-learned words outside React state so finish-time writes
  // cannot lag behind the last learn action.
  const sessionLearnedWordIdsRef = useRef<Set<string>>(new Set());
  const currentIndexRef = useRef(0);
  const lastAppStateRef = useRef(AppState.currentState);
  const leaveConfirmedRef = useRef(false);
  const resumePromptShownRef = useRef<string | null>(null);
  const lastAutoSpokenKeyRef = useRef<string | null>(null);

  // Streak milestone modal
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [streakToShow, setStreakToShow] = useState(0);

  const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
  const STREAK_MILESTONE_KEY = "voca_streak_milestone_shown";

  // The list of vocabulary words to display
  const [cards, setCards] = useState<CourseVocabularyCard[]>([]);

  // Set of IDs for words that are already saved in the user's Word Bank
  const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set());

  // Loading state for asynchronous data fetching
  const [loading, setLoading] = useState(true);

  // Tracks whether the splash screen is still mounted (unmounted after fade-out)
  const [splashVisible, setSplashVisible] = useState(true);

  const dayNumber = parseInt(day || "1", 10);
  const isPreviewMode = preview === "1";
  const [maskVisibility, setMaskVisibility] = useState({
    face: false,
    back: false,
  });
  const isProgressDisabled = isPreviewMode;
  const isDayCompleted =
    !isProgressDisabled &&
    Boolean(courseProgress[courseId as string]?.[dayNumber]?.completed);
  const isStudyCompleted =
    (!isProgressDisabled && (isFinished || isDayCompleted)) || false;
  const shouldTrackLearningProgress =
    !isProgressDisabled && courseProgressLoaded && !isDayCompleted;
  const shouldTrackResumeProgress =
    !isPreviewMode &&
    !isFinished &&
    Boolean(user && courseId && cards.length > 0);

  useEffect(() => {
    sessionLearnedWordIdsRef.current = new Set();
    currentIndexRef.current = 0;
    leaveConfirmedRef.current = false;
    resumePromptShownRef.current = null;
    lastAutoSpokenKeyRef.current = null;
    setInitialDeckIndex(0);
    setActiveSpeechIndex(0);
    setResumeProgressResolved(false);
    setMaskVisibility({ face: false, back: false });
  }, [courseId, dayNumber]);

  const trackSessionLearnedWord = useCallback((wordId: string) => {
    if (sessionLearnedWordIdsRef.current.has(wordId)) {
      return sessionLearnedWordIdsRef.current.size;
    }

    sessionLearnedWordIdsRef.current.add(wordId);
    return sessionLearnedWordIdsRef.current.size;
  }, []);

  const resetMaskToDefault = useCallback(() => {
    setMaskVisibility({ face: false, back: false });
  }, []);

  const setFaceMaskVisibility = useCallback((enabled: boolean) => {
    setMaskVisibility((current) => ({ ...current, face: enabled }));
  }, []);

  const setBackMaskVisibility = useCallback((enabled: boolean) => {
    setMaskVisibility((current) => ({ ...current, back: enabled }));
  }, []);

  const speakVocabularyCard = useCallback(
    async (item: CourseVocabularyCard) => {
      if (isKanjiWord(item)) {
        await handleSpeech(stripReviewMaskDelimiters(item.kanji), "JP");
        return;
      }

      const resolved = resolveVocabularyContent(item, contentLanguage);
      const isJapaneseVocabulary = isJlptLevelCourseId(typedCourseId);

      if (isJapaneseVocabulary) {
        await handleSpeech(
          stripReviewMaskDelimiters(
            resolved.sharedPronunciation ?? resolved.word,
          ),
          "JP",
        );
        return;
      }

      await speakWordVariants(
        stripReviewMaskDelimiters(resolved.word || item.word),
        (text, options) => handleSpeech(text, "EN", options),
        { language: "en-US" },
      );
    },
    [contentLanguage, handleSpeech, typedCourseId],
  );

  useEffect(() => {
    if (
      speechPreferencesLoading ||
      !vocabularyPreferences.autoSpeakVocabulary ||
      !resumeProgressResolved ||
      loading ||
      isFinished ||
      cards.length === 0 ||
      activeSpeechIndex < 0 ||
      activeSpeechIndex >= cards.length
    ) {
      return;
    }

    const item = cards[activeSpeechIndex];
    const speechKey = `${courseId}:${dayNumber}:${activeSpeechIndex}:${item.id}`;
    if (lastAutoSpokenKeyRef.current === speechKey) {
      return;
    }

    lastAutoSpokenKeyRef.current = speechKey;
    void speakVocabularyCard(item).catch((error) => {
      console.warn("Failed to auto speak vocabulary card:", error);
    });
  }, [
    activeSpeechIndex,
    cards,
    courseId,
    dayNumber,
    isFinished,
    loading,
    resumeProgressResolved,
    speechPreferencesLoading,
    speakVocabularyCard,
    vocabularyPreferences.autoSpeakVocabulary,
  ]);

  // ============================================================================
  // Section 3: Data Fetching Effects
  // ============================================================================

  /**
   * Effect: Fetch Vocabulary Data
   *
   * Strategy:
   * 1. Check local cache first for instant load.
   * 2. If valid cache exists, use it.
   * 3. If cache is stale or missing, rehydrate or fetch fresh from Firestore.
   */
  useEffect(() => {
    if (!courseId) return;
    let isMounted = true;

    // Helper to fetch fresh data from Firestore
    const fetchVocabulary = async (showLoading: boolean) => {
      if (showLoading && isMounted) {
        setLoading(true);
      }
      try {
        const fetchedCards = await fetchVocabularyCards(
          courseId as CourseType,
          dayNumber,
        );
        if (isMounted) {
          setCards(fetchedCards);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching vocabulary:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Bootstrap function to implement the caching strategy
    const bootstrap = async () => {
      let hasCache = false;
      let fresh = false;

      // sync synchronous check for in-memory cache
      const cached = getCachedVocabularyCards(
        courseId as CourseType,
        dayNumber,
      );
      if (cached && cached.length > 0) {
        hasCache = true;
        fresh = isVocabularyCacheFresh(courseId as CourseType, dayNumber);
        if (isMounted) {
          setCards(cached);
          setLoading(false);
        }
      } else {
        // Asynchronous check for persistent cache
        if (isMounted) {
          setLoading(true);
        }
        try {
          const stored = await hydrateVocabularyCache(
            courseId as CourseType,
            dayNumber,
            { allowStale: true },
          );
          if (stored && stored.length > 0) {
            hasCache = true;
            fresh = isVocabularyCacheFresh(courseId as CourseType, dayNumber);
            if (isMounted) {
              setCards(stored);
              setLoading(false);
            }
          }
        } catch (error) {
          console.warn("Failed to hydrate vocabulary cache:", error);
        }
      }

      // If no data found in cache, fetch fresh.
      // If cache exists but is stale, fetch background update.
      if (!hasCache) {
        await fetchVocabulary(true);
      } else if (!fresh) {
        void fetchVocabulary(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [courseId, dayNumber]);

  /**
   * Effect: Fetch User's Saved Words
   *
   * Retrieves the list of words the user has saved to their "Word Bank" for this course.
   * This is used to display the "Added" status on cards.
   */
  useEffect(() => {
    const fetchSavedWords = async () => {
      if (isPreviewMode || !user || !courseId) {
        setSavedWordIds(new Set());
        return;
      }

      try {
        const wordBankRef = doc(db, "vocabank", user.uid, "course", courseId);
        const docSnap = await getDoc(wordBankRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const words = data.words || [];
          const ids = new Set(words.map((w: any) => w.id));
          setSavedWordIds(ids as Set<string>);
          return;
        }

        setSavedWordIds(new Set());
      } catch (error) {
        console.error("Error fetching saved words:", error);
      }
    };

    fetchSavedWords();
  }, [user, courseId, isPreviewMode]);

  /**
   * Effect: Fetch User's Course Progress
   *
   * Retrieves the course progress to check if the day has been completed.
   */
  useEffect(() => {
    if (!isProgressDisabled && user && courseId) {
      let isActive = true;
      setCourseProgressLoaded(false);
      void fetchCourseProgress(user.uid, courseId as string).finally(() => {
        if (isActive) {
          setCourseProgressLoaded(true);
        }
      });
      return () => {
        isActive = false;
      };
    }

    setCourseProgressLoaded(true);
  }, [user, courseId, fetchCourseProgress, isProgressDisabled]);

  const persistCurrentResumeProgress = useCallback(async () => {
    if (
      isPreviewMode ||
      !user ||
      !courseId ||
      !shouldTrackResumeProgress
    ) {
      return;
    }

    await saveResumeProgress({
      userId: user.uid,
      courseId: typedCourseId,
      dayNumber,
      cards,
      currentIndex: currentIndexRef.current,
    });
  }, [
    cards,
    courseId,
    dayNumber,
    isPreviewMode,
    shouldTrackResumeProgress,
    typedCourseId,
    user,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = lastAppStateRef.current;
      lastAppStateRef.current = nextState;

      if (
        previousState === "active" &&
        (nextState === "inactive" || nextState === "background")
      ) {
        void persistCurrentResumeProgress().catch((error) => {
          console.warn("Failed to save vocabulary resume progress:", error);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [persistCurrentResumeProgress]);

  useEffect(() => {
    if (
      isPreviewMode ||
      !user ||
      !courseId ||
      !shouldTrackResumeProgress ||
      !courseProgressLoaded
    ) {
      if (isPreviewMode || !user || !courseId) {
        setResumeProgressResolved(true);
      }
      return;
    }

    const promptKey = `${user.uid}:${courseId}:${dayNumber}`;
    if (resumePromptShownRef.current === promptKey) {
      return;
    }

    let isActive = true;
    setResumeProgressResolved(false);
    void getResumeProgress({
      userId: user.uid,
      courseId: typedCourseId,
      dayNumber,
      cards,
    })
      .then((progress) => {
        if (!isActive) return;
        if (!progress) {
          setResumeProgressResolved(true);
          return;
        }
        resumePromptShownRef.current = promptKey;

        Alert.alert(
          t("course.resume.resumeTitle"),
          t("course.resume.resumeMessage"),
          [
            {
              text: t("course.resume.startOver"),
              style: "cancel",
              onPress: () => {
                currentIndexRef.current = 0;
                setInitialDeckIndex(0);
                setActiveSpeechIndex(0);
                lastAutoSpokenKeyRef.current = null;
                setResumeProgressResolved(true);
                void clearResumeProgress({
                  userId: user.uid,
                  courseId: typedCourseId,
                  dayNumber,
                }).catch((error) => {
                  console.warn("Failed to clear resume progress:", error);
                });
              },
            },
            {
              text: t("course.resume.continue"),
              onPress: () => {
                currentIndexRef.current = progress.currentIndex;
                setInitialDeckIndex(progress.currentIndex);
                setActiveSpeechIndex(progress.currentIndex);
                lastAutoSpokenKeyRef.current = null;
                setResumeProgressResolved(true);
              },
            },
          ],
        );
      })
      .catch((error) => {
        console.warn("Failed to load vocabulary resume progress:", error);
        if (isActive) {
          setResumeProgressResolved(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    cards,
    courseId,
    courseProgressLoaded,
    dayNumber,
    isPreviewMode,
    shouldTrackResumeProgress,
    t,
    typedCourseId,
    user,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      // Only intercept explicit back-button / swipe-back gestures (POP).
      // NAVIGATE and RESET actions are programmatic or tab-switch events
      // that should always be allowed through (e.g. after a language change).
      const actionType = event.data.action.type;
      if (actionType !== "POP" && actionType !== "GO_BACK") {
        return;
      }

      if (
        leaveConfirmedRef.current ||
        !user ||
        !courseId ||
        isPreviewMode ||
        loading ||
        cards.length === 0 ||
        !shouldTrackResumeProgress
      ) {
        return;
      }

      event.preventDefault();

      Alert.alert(
        t("course.resume.leaveTitle"),
        t("course.resume.leaveMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("course.resume.leave"),
            style: "destructive",
            onPress: () => {
              void persistCurrentResumeProgress()
                .catch((error) => {
                  console.warn("Failed to save vocabulary resume progress:", error);
                })
                .finally(() => {
                  leaveConfirmedRef.current = true;
                  resetMaskToDefault();
                  navigation.dispatch(event.data.action);
                });
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [
    cards.length,
    courseId,
    isPreviewMode,
    loading,
    navigation,
    persistCurrentResumeProgress,
    resetMaskToDefault,
    shouldTrackResumeProgress,
    t,
    user,
  ]);

  // ============================================================================
  // Section 4: Event Handlers (Swipe & Progress)
  // ============================================================================

  /**
   * Handler: Swipe Right (Learned)
   * Records the word as learned in the local buffer.
   */
  const onSwipeRight = (item: CourseVocabularyCard) => {
    if (!shouldTrackLearningProgress) {
      return;
    }

    if (user) {
      const wordId = `${courseId}-${item.id}`;
      trackSessionLearnedWord(wordId);
      bufferWordLearned(user.uid, wordId);
    }
  };

  /**
   * Handler: Swipe Left (Review/Skipped)
   * Skipped words are not counted as learned.
   */
  const onSwipeLeft = (_item: CourseVocabularyCard) => {};

  /**
   * Handler: Deck Finished
   * Triggered when the user runs out of cards (completes the day).
   *
   * Actions:
   * 1. Sets 'isFinished' state to show completion view.
   * 2. Flushes buffered learning stats to Firestore.
   * 3. Marks the course day as 'completed' in user profile.
   */
  const handleRunOutOfCards = async () => {
    resetMaskToDefault();
    setIsFinished(true);
    if (isProgressDisabled) {
      return;
    }

    if (user && courseId && shouldTrackLearningProgress) {
      const learnedCount = sessionLearnedWordIdsRef.current.size;

      // Flush buffered words to database
      await flushWordStats(user.uid);

      // Check for streak milestone
      const newStreak = useUserStatsStore.getState().stats?.currentStreak ?? 0;
      if (STREAK_MILESTONES.includes(newStreak)) {
        const raw = await AsyncStorage.getItem(STREAK_MILESTONE_KEY);
        const lastShown = raw ? parseInt(raw, 10) : 0;
        if (newStreak > lastShown) {
          await AsyncStorage.setItem(STREAK_MILESTONE_KEY, String(newStreak));
          setStreakToShow(newStreak);
          setStreakModalVisible(true);
        }
      }

      try {
        const completedAt = new Date().toISOString();
        const studyDate = formatDateKey(new Date());

        // Update user's progress for this specific course and day
        await updateDoc(doc(db, "users", user.uid), {
          [`courseProgress.${courseId}.${dayNumber}.completed`]: true,
          [`courseProgress.${courseId}.${dayNumber}.totalWords`]: cards.length,
          [`courseProgress.${courseId}.${dayNumber}.wordsLearned`]:
            learnedCount,
        });

        // Update local store state for immediate UI reflection
        updateCourseDayProgress(courseId, dayNumber, {
          completed: true,
          totalWords: cards.length,
          wordsLearned: learnedCount,
        });

        await upsertVocabularyDayStudyHistory({
          userId: user.uid,
          date: studyDate,
          entry: {
            courseId,
            dayNumber,
            wordsLearned: learnedCount,
            totalWords: cards.length,
            completedAt,
          },
        });

        await clearResumeProgress({
          userId: user.uid,
          courseId,
          dayNumber,
        });
      } catch (error) {
        console.error("Error marking day as completed:", error);
      }
      return;
    }

    if (user && courseId && shouldTrackResumeProgress) {
      await clearResumeProgress({
        userId: user.uid,
        courseId,
        dayNumber,
      });
    }
  };

  /**
   * Handler: Page Change (for Collocation PagerView)
   * Since Collocation cards use a PagerView instead of SwipeDeck,
   * we simply record the word as learned when the user navigates to its page.
   */
  const handlePageChange = (index: number) => {
    resetMaskToDefault();
    currentIndexRef.current = index;
    setActiveSpeechIndex(index);

    void persistCurrentResumeProgress().catch((error) => {
      console.warn("Failed to save vocabulary resume progress:", error);
    });

    if (!shouldTrackLearningProgress) {
      return;
    }

    if (cards[index]) {
      const item = cards[index];
      if (user) {
        const wordId = `${courseId}-${item.id}`;
        trackSessionLearnedWord(wordId);
        bufferWordLearned(user.uid, wordId);
      }
    }
  };

  const handleSavedWordChange = React.useCallback(
    (wordId: string, isSaved: boolean) => {
      setSavedWordIds((previous) => {
        const next = new Set(previous);
        if (isSaved) {
          next.add(wordId);
        } else {
          next.delete(wordId);
        }
        return next;
      });
    },
    [],
  );

  // ============================================================================
  // Section 5: Navigation Actions
  // ============================================================================

  /**
   * Action: Start Quiz
   * Navigates to the Quiz selection screen for this day.
   */
  const handleQuiz = () => {
    router.push({
      pathname: "/course/[courseId]/quiz-type",
      params: { courseId, day },
    });
  };

  /**
   * Action: Return to Days
   * Navigates back to the day picker for this course.
   */
  const handleDays = () => {
    resetMaskToDefault();
    router.dismissTo({
      pathname: "/course/[courseId]/days",
      params: { courseId },
    });
  };

  // ============================================================================
  // Section 6: Render Helpers & Main Render
  // ============================================================================

  const renderFinishedView = () => (
    isPreviewMode ? (
      <View style={styles.previewFinishContainer}>
        <Text
          style={[
            styles.previewFinishTitle,
            { color: isDark ? "#fff" : "#1a1a1a" },
          ]}
        >
          {t("course.previewComplete", { defaultValue: "Preview complete" })}
        </Text>
        <TouchableOpacity
          style={styles.previewReturnButton}
          onPress={handleDays}
          activeOpacity={0.8}
        >
          <Text style={styles.previewReturnButtonText}>
            {t("course.previewReturn", { defaultValue: "Back to days" })}
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <VocabularyFinishView
        isDark={isDark}
        day={dayNumber}
        onQuiz={handleQuiz}
        onDays={handleDays}
        t={t}
      />
    )
  );

  const hasCards = () => cards.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColors.screen }]}
      edges={hasCards() ? ["bottom"] : ["top", "bottom"]}
    >
      <Stack.Screen
        options={{
          headerShown: hasCards() && !isFinished,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bgColors.screen },
          headerTintColor: isDark ? "#fff" : "#000",
          headerBackTitle: t("common.back"),
          title: isPreviewMode
            ? t("course.preview", { defaultValue: "Preview" })
            : "",
          headerRight: hasCards() && !isFinished
            ? () => (
                <View
                  testID="vocabulary-header-right"
                  style={styles.headerRight}
                >
                  <DayBadge day={dayNumber} />
                  <LanguageHeaderButton
                    showJapaneseKoreanOption={
                      courseId === "KANJI" || isJlptLevelCourseId(courseId)
                    }
                  />
                  <EyeComfortHeaderButton />
                </View>
              )
            : undefined,
          headerBackVisible: !splashVisible && hasCards() ? true : false,
          gestureEnabled: !loading,
          headerLeft: loading ? () => null : undefined,
        }}
      />
      <View style={styles.swipeContainer}>
        <View
          style={[
            styles.deckContainer,
            hasCards() &&
              !(isFinished && courseId !== "COLLOCATION") &&
              styles.activeDeckContainer,
          ]}
        >
          {hasCards() ? (
            isFinished && courseId !== "COLLOCATION" ? (
              renderFinishedView()
            ) : (
              <VocabularySwipeDeck
                cards={cards}
                courseId={courseId as CourseType}
                isDark={isDark}
                dayNumber={dayNumber}
                savedWordIds={savedWordIds}
                onSavedWordChange={handleSavedWordChange}
                onSwipeRight={onSwipeRight}
                onSwipeLeft={onSwipeLeft}
                onIndexChange={handlePageChange}
                onFinish={handleRunOutOfCards}
                initialIndex={initialDeckIndex}
                renderFinishView={renderFinishedView}
                isStudyCompleted={
                  isStudyCompleted || isPreviewMode
                }
                isPreviewMode={isPreviewMode}
                isReviewMode={maskVisibility.face}
                isFaceReviewMode={maskVisibility.face}
                isBackReviewMode={maskVisibility.back}
                reviewMaskTarget={vocabularyPreferences.reviewMaskTarget}
                onMaskChange={setFaceMaskVisibility}
                onFaceMaskChange={setFaceMaskVisibility}
                onBackMaskChange={setBackMaskVisibility}
              />
            )
          ) : (
            <VocabularyEmptyState isDark={isDark} />
          )}
        </View>
      </View>
      {splashVisible && (
        <AppSplashScreen
          visible={loading}
          onHidden={() => setSplashVisible(false)}
        />
      )}
      <StreakMilestoneModal
        visible={streakModalVisible}
        streak={streakToShow}
        onClose={() => setStreakModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  swipeContainer: {
    flex: 1,
    width: width,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  deckContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  activeDeckContainer: {
    justifyContent: "flex-start",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginRight: 4,
  },
  previewFinishContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 18,
  },
  previewFinishTitle: {
    fontSize: 28,
    fontWeight: FontWeights.extraBold,
    textAlign: "center",
  },
  previewReturnButton: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD166",
  },
  previewReturnButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: FontWeights.bold,
  },
});
