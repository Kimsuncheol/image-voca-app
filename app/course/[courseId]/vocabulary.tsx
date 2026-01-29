import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
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
import { VocabularyEmptyState } from "../../../components/course/vocabulary/VocabularyEmptyState";
import { VocabularyFinishView } from "../../../components/course/vocabulary/VocabularyFinishView";
import { VocabularyLoadingSkeleton } from "../../../components/course/vocabulary/VocabularyLoadingSkeleton";
import { VocabularySwipeDeck } from "../../../components/course/vocabulary/VocabularySwipeDeck";

const { width, height } = Dimensions.get("window");

export default function VocabularyScreen() {
  // --- Hooks & Contexts ---
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { bufferWordLearned, flushWordStats, updateCourseDayProgress } =
    useUserStatsStore();

  // Track time spent learning on this screen
  useTimeTracking();

  // Navigation params: courseId (e.g., 'TOEIC') and day (e.g., '1')
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  // --- State Management ---
  const [isFinished, setIsFinished] = useState(false); // Tracks if user completed all cards
  const [cards, setCards] = useState<VocabularyCard[]>([]); // The list of vocabulary words
  const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set()); // IDs of words saved in WordBank
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  const dayNumber = parseInt(day || "1", 10);

  // --- Effects: Data Fetching ---

  /**
   * Effect to fetch vocabulary data from Firestore based on courseId and day.
   * Runs when courseId or dayNumber changes.
   */
  useEffect(() => {
    if (!courseId) return;
    let isMounted = true;

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

    const bootstrap = async () => {
      let hasCache = false;
      let fresh = false;

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
   * Effect to fetch saved word IDs from the user's Word Bank.
   * This allows the UI to show which cards are already saved.
   */
  useEffect(() => {
    const fetchSavedWords = async () => {
      if (!user || !courseId) return;

      try {
        const wordBankRef = doc(db, "vocabank", user.uid, "course", courseId);
        const docSnap = await getDoc(wordBankRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const words = data.words || [];
          const ids = new Set(words.map((w: any) => w.id));
          setSavedWordIds(ids as Set<string>);
        }
      } catch (error) {
        console.error("Error fetching saved words:", error);
      }
    };

    fetchSavedWords();
  }, [user, courseId]);

  // --- Event Handlers: Swipe & Progress ---

  /**
   * Handler for swiping right (Learned).
   * Buffers the word as learned in the user stats store.
   */
  const onSwipeRight = (item: VocabularyCard) => {
    console.log("Learned:", item.word);
    if (user) {
      const wordId = `${courseId}-${item.id}`;
      bufferWordLearned(user.uid, wordId);
    }
  };

  /**
   * Handler for swiping left (Skipped/Review).
   * Currently treats skipped words as 'viewed/learned' for progress tracking purposes.
   */
  const onSwipeLeft = (item: VocabularyCard) => {
    console.log("Learned:", item.word);
    if (user) {
      const wordId = `${courseId}-${item.id}`;
      bufferWordLearned(user.uid, wordId);
    }
  };

  /**
   * Handler for when all cards in the deck have been swiped/viewed.
   * 1. Marks the session as finished.
   * 2. Flushes buffered stats to Firestore.
   * 3. Updates the course progress (completion status) in Firestore.
   */
  const handleRunOutOfCards = async () => {
    setIsFinished(true);
    if (user && courseId) {
      // Flush buffered words to database
      await flushWordStats(user.uid);

      try {
        // Update user's progress for this specific course and day
        await updateDoc(doc(db, "users", user.uid), {
          [`courseProgress.${courseId}.${dayNumber}.completed`]: true,
          [`courseProgress.${courseId}.${dayNumber}.totalWords`]: cards.length,
          [`courseProgress.${courseId}.${dayNumber}.wordsLearned`]:
            cards.length,
        });

        // Update local store state
        updateCourseDayProgress(courseId, dayNumber, {
          completed: true,
          totalWords: cards.length,
          wordsLearned: cards.length,
        });
      } catch (error) {
        console.error("Error marking day as completed:", error);
      }
    }
  };

  /**
   * Handler for Collocation Swipeable page change.
   * Records the word as learned when viewed in the pager.
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

  // --- Event Handlers: Navigation Actions ---

  const handleRestart = () => {
    // Reset cards to force re-render/reset of deck
    setCards([...cards]);
    router.replace({
      pathname: "/course/[courseId]/vocabulary",
      params: { courseId, day },
    });
  };

  const handleQuiz = () => {
    router.push({
      pathname: "/course/[courseId]/quiz-type",
      params: { courseId, day },
    });
  };

  // --- Render Helpers ---

  const renderFinishedView = () => (
    <VocabularyFinishView
      isDark={isDark}
      onQuiz={handleQuiz}
      onRestart={handleRestart}
      t={t}
    />
  );

  // --- Main Render ---

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <Stack.Screen
          options={{
            title: t("course.dayTitle", { day: dayNumber }),
            headerBackTitle: t("common.back"),
          }}
        />
        <VocabularyLoadingSkeleton courseId={courseId as CourseType} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen
        options={{
          title: t("course.dayTitle", { day: dayNumber }),
          headerBackTitle: t("common.back"),
        }}
      />
      <View style={styles.swipeContainer}>
        {cards.length > 0 ? (
          <View
            style={{
              flex: 1,
              width: "100%",
              // For Collocation cards (PagerView), we keep the view visible to show the finish page inside the pager
              // For TinderSwipe, we hide it when finished to show the separate completion view
              display:
                isFinished && courseId !== "COLLOCATION" ? "none" : "flex",
            }}
          >
            <VocabularySwipeDeck
              cards={cards}
              courseId={courseId as CourseType}
              isDark={isDark}
              dayNumber={dayNumber}
              savedWordIds={savedWordIds}
              onSwipeRight={onSwipeRight}
              onSwipeLeft={onSwipeLeft}
              onIndexChange={handlePageChange}
              onFinish={handleRunOutOfCards}
              renderFinishView={renderFinishedView}
            />
          </View>
        ) : (
          <VocabularyEmptyState isDark={isDark} />
        )}

        {/* 
          Show finish view explicitly for non-Collocation courses.
          Collocation courses handle the finish view internally within the PagerView.
        */}
        {isFinished && courseId !== "COLLOCATION" && renderFinishedView()}
      </View>
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
    height: height * 0.8,
    width: width,
    alignItems: "center",
    justifyContent: "center",
  },
});
