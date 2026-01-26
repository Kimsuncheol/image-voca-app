import {
  TinderSwipe,
  TinderSwipeRef,
} from "@/src/components/tinder-swipe/TinderSwipe";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeCardItem } from "../../../components/swipe/SwipeCardItem";
import { VocabularyCardSkeleton } from "../../../components/swipe/VocabularyCardSkeleton";

import { CollocationSwipeable } from "../../../components/CollocationFlipCard/CollocationSwipeable";

import CollocationSkeleton from "@/components/CollocationFlipCard/CollocationSkeleton";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useTimeTracking } from "../../../src/hooks/useTimeTracking";
import { db } from "../../../src/services/firebase";
import { useUserStatsStore } from "../../../src/stores";
import { CourseType, VocabularyCard } from "../../../src/types/vocabulary";

const { width, height } = Dimensions.get("window");

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
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { bufferWordLearned, flushWordStats, updateCourseDayProgress } =
    useUserStatsStore();
  useTimeTracking(); // Track time spent on this screen
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();
  const router = useRouter();
  const [isFinished, setIsFinished] = useState(false);
  const swipeRef = useRef<TinderSwipeRef>(null);
  const { t } = useTranslation();

  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const dayNumber = parseInt(day || "1", 10);

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

        // Don't use prefix
        // Don't modify this line
        // Construct subcollection name: e.g. CSAT1_Day1
        const subCollectionName = `Day${dayNumber}`;
        // const subCollectionName = `${config.prefix}1_Day${dayNumber}`;
        const targetCollection = collection(db, config.path, subCollectionName);

        // Fetch data
        // Try ordering by word or just fetch as is
        const q = query(targetCollection);
        const querySnapshot = await getDocs(q);

        const fetchedCards: VocabularyCard[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          if (courseId === "COLLOCATION") {
            return {
              id: doc.id,
              word: data.collocation, // Map 'collocation' to 'word'
              meaning: data.meaning,
              translation: data.translation,
              pronunciation: data.explanation, // Map 'explanation' to 'pronunciation' field for now, or we need to update VocabularyCard type
              example: data.example,
              image: data.image,
              course: courseId as CourseType,
            };
          }

          return {
            id: doc.id,
            word: data.word,
            meaning: data.meaning,
            translation: data.translation,
            pronunciation: data.pronunciation,
            example: data.example,
            image: data.image, // Optional if it exists
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
    fetchVocabulary();
  }, [courseId, dayNumber]);

  // Fetch saved words from Word Bank
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

  const onSwipeRight = (item: VocabularyCard) => {
    console.log("Learned:", item.word);
    // Record unique word learned (prevents duplicates)
    if (user) {
      const wordId = `${courseId}-${item.id}`;
      bufferWordLearned(user.uid, wordId);
    }
  };

  const onSwipeLeft = (item: VocabularyCard) => {
    console.log("Learned:", item.word);
    // console.log("Skipped:", item.word);
    // Still counts as viewing the word
    if (user) {
      const wordId = `${courseId}-${item.id}`;
      bufferWordLearned(user.uid, wordId);
    }
  };

  const handleRunOutOfCards = async () => {
    setIsFinished(true);
    if (user && courseId) {
      // Flush buffered words
      await flushWordStats(user.uid);

      try {
        await updateDoc(doc(db, "users", user.uid), {
          [`courseProgress.${courseId}.${dayNumber}.completed`]: true,
          [`courseProgress.${courseId}.${dayNumber}.totalWords`]: cards.length,
          [`courseProgress.${courseId}.${dayNumber}.wordsLearned`]:
            cards.length,
        });
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

  const handlePageChange = (index: number) => {
    // Determine which word was just "viewed".
    // PagerView: current index is visible.
    // If we want to mark it as learned when viewed:
    if (cards[index]) {
      const item = cards[index];
      // console.log("Learned (Pager):", item.word);
      if (user) {
        const wordId = `${courseId}-${item.id}`;
        bufferWordLearned(user.uid, wordId);
      }
    }
  };

  const handleRestart = () => {
    setCards([...cards]); // Re-set cards to trigger re-render if needed, but keys might need update.
    // Ideally fetch again or just reset index. TinderSwipe might need a key change to reset.
    // For now simplistic reload.
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
        <View style={styles.swipeContainer}>
          {courseId === "COLLOCATION" ? (
            <CollocationSkeleton />
          ) : (
            <VocabularyCardSkeleton />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const renderFinishedView = () => (
    <View style={styles.finishedContainer}>
      <Text style={[styles.finishedText, { color: isDark ? "#fff" : "#000" }]}>
        {t("course.checked")}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.quizButton]}
          onPress={handleQuiz}
        >
          <Text style={styles.buttonText}>{t("course.takeQuiz")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.restartButton]}
          onPress={handleRestart}
        >
          <Text style={styles.buttonText}>{t("common.review")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
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
              // For Collocation, we keep the view visible to show the finish page inside the pager
              display:
                isFinished && courseId !== "COLLOCATION" ? "none" : "flex",
            }}
          >
            {courseId === "COLLOCATION" ? (
              <CollocationSwipeable
                data={cards}
                isDark={isDark}
                onIndexChange={handlePageChange}
                onFinish={handleRunOutOfCards}
                renderFinalPage={renderFinishedView}
              />
            ) : (
              <TinderSwipe
                ref={swipeRef}
                data={cards}
                renderCard={(item) => (
                  <SwipeCardItem
                    item={item}
                    initialIsSaved={savedWordIds.has(item.id)}
                    day={dayNumber}
                  />
                )}
                onSwipeRight={onSwipeRight}
                onSwipeLeft={onSwipeLeft}
                loop={false}
                onRunOutOfCards={handleRunOutOfCards}
              />
            )}
          </View>
        ) : (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: isDark ? "#fff" : "#000" }}>
              No words found for this day.
            </Text>
          </View>
        )}

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
  finishedContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  finishedText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quizButton: {
    backgroundColor: "#28a745",
  },
  restartButton: {
    backgroundColor: "#007bff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
