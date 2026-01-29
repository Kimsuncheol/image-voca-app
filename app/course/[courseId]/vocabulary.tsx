import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
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
import { useUserStatsStore } from "../../../src/stores";
import { CourseType, VocabularyCard } from "../../../src/types/vocabulary";

// Components
import { VocabularyEmptyState } from "../../../components/course/vocabulary/VocabularyEmptyState";
import { VocabularyFinishView } from "../../../components/course/vocabulary/VocabularyFinishView";
import { VocabularyLoadingSkeleton } from "../../../components/course/vocabulary/VocabularyLoadingSkeleton";
import { VocabularySwipeDeck } from "../../../components/course/vocabulary/VocabularySwipeDeck";

const { width, height } = Dimensions.get("window");

// --- Helper Functions ---

/**
 * Maps the course ID to the corresponding Firestore collection path and prefix.
 * This determines where to fetch the vocabulary data from.
 */
const getCourseConfig = (courseId: CourseType) => {
  switch (courseId) {
    case "수능":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_CSAT,
        prefix: "CSAT",
      };
    case "TOEIC":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC,
        prefix: "TOEIC",
      };
    case "TOEFL":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL,
        prefix: "TOEFL",
      };
    case "IELTS":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_IELTS,
        prefix: "IELTS",
      };
    case "COLLOCATION":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION,
        prefix: "COLLOCATION",
      };
    default:
      return { path: "", prefix: "" };
  }
};

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
    const fetchVocabulary = async () => {
      setLoading(true);
      try {
        const config = getCourseConfig(courseId as CourseType);

        if (!config.path) {
          console.error("No path configuration for course:", courseId);
          setLoading(false);
          return;
        }

        // Construct the subcollection name (e.g., "Day1")
        const subCollectionName = `Day${dayNumber}`;
        const targetCollection = collection(db, config.path, subCollectionName);

        // Query Firestore for all documents in the day's collection
        const q = query(targetCollection);
        const querySnapshot = await getDocs(q);

        // Map Firestore documents to VocabularyCard objects
        const fetchedCards: VocabularyCard[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          // Handle special structure for Collocation course
          if (courseId === "COLLOCATION") {
            return {
              id: doc.id,
              word: data.collocation, // Map 'collocation' to 'word' property
              meaning: data.meaning,
              translation: data.translation,
              pronunciation: data.explanation, // Temporarily map 'explanation' to pronunciation
              example: data.example,
              image: data.image,
              course: courseId as CourseType,
            };
          }

          // Standard structure for other courses
          return {
            id: doc.id,
            word: data.word,
            meaning: data.meaning,
            translation: data.translation,
            pronunciation: data.pronunciation,
            example: data.example,
            image: data.image,
            course: courseId as CourseType,
          };
        });

        console.log(
          `Fetched ${fetchedCards.length} words from ${subCollectionName}`,
        );
        setCards(fetchedCards);
      } catch (error) {
        console.error("Error fetching vocabulary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
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
