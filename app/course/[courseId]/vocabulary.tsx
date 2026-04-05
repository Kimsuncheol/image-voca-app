import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Contexts & Service
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useTimeTracking } from "../../../src/hooks/useTimeTracking";
import { db } from "../../../src/services/firebase";
import {
  fetchVocabularyCards,
  getCachedVocabularyCards,
  hydrateVocabularyCache,
  isVocabularyCacheFresh,
} from "../../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../../src/stores";
import { CourseType, VocabularyCard } from "../../../src/types/vocabulary";

// Components
import { AppSplashScreen } from "../../../components/common/AppSplashScreen";
import { StreakMilestoneModal } from "../../../components/common/StreakMilestoneModal";
import { VocabularyEmptyState } from "../../../components/course/vocabulary/VocabularyEmptyState";
import { VocabularyFinishView } from "../../../components/course/vocabulary/VocabularyFinishView";
import { VocabularySwipeDeck } from "../../../components/course/vocabulary/VocabularySwipeDeck";

const { width, height } = Dimensions.get("window");

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
  // ============================================================================
  // Section 1: Hooks & Contexts
  // ============================================================================
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Zustand store actions for managing user statistics and progress
  const {
    bufferWordLearned,
    flushWordStats,
    updateCourseDayProgress,
    courseProgress,
    fetchCourseProgress,
  } = useUserStatsStore();

  // Custom hook to track time spent learning based on screen focus
  useTimeTracking();

  // Navigation parameters: courseId (e.g., 'TOEIC') and day (e.g., '1')
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  // ============================================================================
  // Section 2: State Management
  // ============================================================================

  // Tracks if the user has completed swiping through all cards
  const [isFinished, setIsFinished] = useState(false);

  // Tracks how many cards were swiped right (learned)
  const [learnedCount, setLearnedCount] = useState(0);

  // Streak milestone modal
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [streakToShow, setStreakToShow] = useState(0);

  const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
  const STREAK_MILESTONE_KEY = "voca_streak_milestone_shown";

  // The list of vocabulary words to display
  const [cards, setCards] = useState<VocabularyCard[]>([]);

  // Set of IDs for words that are already saved in the user's Word Bank
  const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set());

  // Loading state for asynchronous data fetching
  const [loading, setLoading] = useState(true);

  // Tracks whether the splash screen is still mounted (unmounted after fade-out)
  const [splashVisible, setSplashVisible] = useState(true);

  const dayNumber = parseInt(day || "1", 10);

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
      if (!user || !courseId) {
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
  }, [user, courseId]);

  /**
   * Effect: Fetch User's Course Progress
   *
   * Retrieves the course progress to check if the day has been completed.
   */
  useEffect(() => {
    if (user && courseId) {
      void fetchCourseProgress(user.uid, courseId as string);
    }
  }, [user, courseId, fetchCourseProgress]);

  // ============================================================================
  // Section 4: Event Handlers (Swipe & Progress)
  // ============================================================================

  /**
   * Handler: Swipe Right (Learned)
   * Records the word as learned in the local buffer.
   */
  const onSwipeRight = (item: VocabularyCard) => {
    if (user) {
      const wordId = `${courseId}-${item.id}`;
      bufferWordLearned(user.uid, wordId);
      setLearnedCount((prev) => prev + 1);
    }
  };

  /**
   * Handler: Swipe Left (Review/Skipped)
   * Skipped words are not counted as learned.
   */
  const onSwipeLeft = (_item: VocabularyCard) => {};

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
    setIsFinished(true);
    if (user && courseId) {
      // Flush buffered words to database
      await flushWordStats(user.uid);

      // Check for streak milestone
      const newStreak =
        useUserStatsStore.getState().stats?.currentStreak ?? 0;
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
        // Update user's progress for this specific course and day
        await updateDoc(doc(db, "users", user.uid), {
          [`courseProgress.${courseId}.${dayNumber}.completed`]: true,
          [`courseProgress.${courseId}.${dayNumber}.totalWords`]: cards.length,
          [`courseProgress.${courseId}.${dayNumber}.wordsLearned`]: learnedCount,
        });

        // Update local store state for immediate UI reflection
        updateCourseDayProgress(courseId, dayNumber, {
          completed: true,
          totalWords: cards.length,
          wordsLearned: learnedCount,
        });
      } catch (error) {
        console.error("Error marking day as completed:", error);
      }
    }
  };

  /**
   * Handler: Page Change (for Collocation PagerView)
   * Since Collocation cards use a PagerView instead of SwipeDeck,
   * we simply record the word as learned when the user navigates to its page.
   */
  const handlePageChange = (index: number) => {
    if (cards[index]) {
      const item = cards[index];
      if (user) {
        const wordId = `${courseId}-${item.id}`;
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
   * Action: Restart Day
   * Resets the current learning session.
   */
  const handleRestart = () => {
    // Reset cards to force re-render/reset of deck
    setCards([...cards]);
    router.replace({
      pathname: "/course/[courseId]/vocabulary",
      params: { courseId, day },
    });
  };

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
   * Action: Read Manga
   * Navigates to the manga reader for content related to this course and day.
   */
  const handleManga = () => {
    router.push({
      pathname: "/manga/reader",
      params: { courseId, day: String(dayNumber) },
    });
  };

  // ============================================================================
  // Section 6: Render Helpers & Main Render
  // ============================================================================

  const renderFinishedView = () => (
    <VocabularyFinishView
      isDark={isDark}
      day={dayNumber}
      onQuiz={handleQuiz}
      onRestart={handleRestart}
      onManga={handleManga}
      t={t}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen
        options={{
          title: "",
          headerBackTitle: t("common.back"),
          // headerBackVisible: !loading,
          headerBackVisible: !splashVisible ? true : false,
          gestureEnabled: !loading,
          headerLeft: loading ? () => null : undefined,
        }}
      />
      <View style={styles.swipeContainer}>
        <View style={styles.deckContainer}>
          {cards.length > 0 ? (
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
                renderFinishView={renderFinishedView}
                isStudyCompleted={
                  courseProgress[courseId as string]?.[dayNumber]?.completed ||
                  false
                }
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
    justifyContent: "center",
  },
  swipeContainer: {
    height: height * 0.76,
    width: width,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  deckContainer: {
    flex: 1,
    width: "100%",
  },
});
