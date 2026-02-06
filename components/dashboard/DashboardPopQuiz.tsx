import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, limit, query } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useSpeech } from "../../src/hooks/useSpeech";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { QuizTimer } from "../course/QuizTimer";
import { ThemedText } from "../themed-text";
import { PopQuizSkeleton } from "./PopQuizSkeleton";

// Target courses for pop quiz: CSAT, Collocation, TOEIC
const QUIZ_COURSES = [
  { id: "수능", wordsPerCourse: 5 },
  { id: "COLLOCATION", wordsPerCourse: 5 },
  { id: "TOEIC", wordsPerCourse: 5 },
] as const;

/**
 * DashboardPopQuiz Component
 *
 * A simplified quiz widget displayed on the dashboard.
 * Features:
 * - Fetches random vocabulary words from various courses.
 * - Displays a multiple-choice quiz format.
 * - Handles batching and prefetching for infinite play.
 * - Tracks user answers and updates statistics.
 */
export function DashboardPopQuiz() {
  // ---------------------------------------------------------------------------
  // Hooks & Context
  // ---------------------------------------------------------------------------
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bufferQuizAnswer, flushQuizStats } = useUserStatsStore();
  const { speak: speakText, stop: stopSpeech } = useSpeech();

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  // Batch prefetch state: manages batches of words to minimize database reads
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [nextBatch, setNextBatch] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // Quiz state: manages the current question and UI interaction
  const [quizItem, setQuizItem] = useState<{
    word: string;
    meaning: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const quizKey = `${turnNumber}-${currentIndex}`;

  // ---------------------------------------------------------------------------
  // Animations & Cache
  // ---------------------------------------------------------------------------
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Cache for fetched batches (key: "courseId-dayNum", value: word array)
  const batchCache = useRef<Map<string, any[]>>(new Map());

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------
  /**
   * Helper to get Firestore collection path based on course ID.
   */
  const getCoursePath = (courseId: string) => {
    switch (courseId) {
      case "수능":
        return process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "";
      case "TOEIC":
        return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "";
      case "TOEFL":
        return process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL || "";
      case "TOEIC_SPEAKING":
        return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING || "";
      case "IELTS":
        return process.env.EXPO_PUBLIC_COURSE_PATH_IELTS || "";
      case "OPIC":
        return process.env.EXPO_PUBLIC_COURSE_PATH_OPIC || "";
      case "COLLOCATION":
        return process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION || "";
      default:
        return "";
    }
  };

  // ---------------------------------------------------------------------------
  /**
   * Normalize word data to ensure consistent structure across different courses.
   * Collocation course uses 'collocation' field instead of 'word'.
   */
  const normalizeWordData = (data: any, courseId: string) => {
    if (courseId === "COLLOCATION") {
      return {
        word: data.collocation,
        meaning: data.meaning,
        ...data,
      };
    }
    return data;
  };

  /**
   * Fetch words from a specific course for pop quiz.
   * Returns an array of words or empty array if no words found.
   * Collects words from multiple days if needed to reach target count.
   */
  const fetchWordsFromCourse = useCallback(
    async (courseId: string, count: number): Promise<any[]> => {
      const path = getCoursePath(courseId);
      if (!path) {
        console.log(`No path configured for course: ${courseId}`);
        return [];
      }

      const collectedWords: any[] = [];

      // Generate random days to try (1-30)
      const daysToTry = Array.from({ length: 30 }, (_, index) => index + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 10); // Try more days to find enough words

      for (const dayNum of daysToTry) {
        if (collectedWords.length >= count) break; // Got enough words

        const subCollectionName = `Day${dayNum}`;
        const cacheKey = `${courseId}-${dayNum}`;

        // Check cache first
        if (batchCache.current.has(cacheKey)) {
          const cachedData = batchCache.current.get(cacheKey)!;
          if (cachedData.length > 0) {
            const shuffled = [...cachedData].sort(() => Math.random() - 0.5);
            const wordsToTake = Math.min(
              shuffled.length,
              count - collectedWords.length,
            );
            collectedWords.push(...shuffled.slice(0, wordsToTake));
            console.log(
              `Using ${wordsToTake} cached words from ${courseId} - ${subCollectionName}`,
            );
            continue;
          }
        }

        try {
          // Fetch words from this day
          const q = query(collection(db, path, subCollectionName), limit(15));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            // Store in cache for future use (normalized)
            const allDocs = snapshot.docs.map((d) =>
              normalizeWordData(d.data(), courseId),
            );
            batchCache.current.set(cacheKey, allDocs);

            // Take as many words as needed
            const shuffled = allDocs.sort(() => Math.random() - 0.5);
            const wordsToTake = Math.min(
              shuffled.length,
              count - collectedWords.length,
            );
            collectedWords.push(...shuffled.slice(0, wordsToTake));
            console.log(
              `Fetched ${wordsToTake} words from ${courseId} - ${subCollectionName}`,
            );
          }
        } catch (error) {
          console.log(
            `Error fetching from ${courseId}/${subCollectionName}:`,
            error,
          );
        }
      }

      if (collectedWords.length === 0) {
        console.log(`No words found for course: ${courseId}`);
      } else {
        console.log(
          `Total collected from ${courseId}: ${collectedWords.length} words`,
        );
      }

      return collectedWords;
    },
    [],
  );

  /**
   * Fetch a batch of 15 words from multiple courses (CSAT, Collocation, TOEIC).
   * Fetches 5 words from each course (if available), then shuffles them together.
   * Only includes words from courses that have available data.
   */
  const fetchBatch = useCallback(async () => {
    try {
      const allWords: any[] = [];

      // Fetch words from each target course in parallel
      const fetchPromises = QUIZ_COURSES.map(async ({ id, wordsPerCourse }) => {
        const words = await fetchWordsFromCourse(id, wordsPerCourse);
        return { courseId: id, words };
      });

      const results = await Promise.all(fetchPromises);

      // Collect all successfully fetched words
      for (const { courseId, words } of results) {
        if (words.length > 0) {
          console.log(`Added ${words.length} words from ${courseId}`);
          allWords.push(...words);
        } else {
          console.log(`Skipped ${courseId} - no words available`);
        }
      }

      if (allWords.length === 0) {
        console.warn("No vocabulary data found in any course");
        return [];
      }

      // Shuffle all collected words together
      const shuffled = allWords.sort(() => Math.random() - 0.5);
      console.log(
        `Total batch size: ${shuffled.length} words (shuffled from multiple courses)`,
      );

      return shuffled;
    } catch (e) {
      console.error("Batch fetch error", e);
      return [];
    }
  }, [fetchWordsFromCourse]);

  /**
   * Prefetch the next batch in the background with retry logic.
   * Uses exponential backoff for failed attempts.
   */
  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching) return;

    setIsPrefetching(true);

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const batch = await fetchBatch();

        if (batch.length > 0) {
          setNextBatch(batch);
          setIsPrefetching(false);
          console.log(`Prefetched next batch (attempt ${attempt + 1})`);
          return;
        }

        // If empty batch, retry
        attempt++;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
          console.log(
            `Retrying prefetch in ${delay}ms (attempt ${attempt + 1})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Prefetch attempt ${attempt + 1} failed:`, error);
        attempt++;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.warn("Failed to prefetch next batch after all retries");
    setIsPrefetching(false);
  }, [fetchBatch, isPrefetching]);

  // ---------------------------------------------------------------------------
  // Quiz Generation & Navigation Logic
  // ---------------------------------------------------------------------------
  /**
   * Generates a single quiz item from the current batch.
   * Creates distractors from other words in the same batch.
   */
  const generateQuiz = useCallback((wordData: any, batch: any[]) => {
    if (batch.length < 4) return;

    // Use wordData as target
    const targetWord = wordData;

    // Pick 3 distractors from batch
    const distractors: string[] = [];
    const availableWords = batch.filter((w) => w.word !== targetWord.word);

    while (distractors.length < 3 && availableWords.length > 0) {
      const randIndex = Math.floor(Math.random() * availableWords.length);
      distractors.push(availableWords[randIndex].meaning);
      availableWords.splice(randIndex, 1);
    }

    // Shuffle options
    const allOptions = [...distractors, targetWord.meaning];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    setQuizItem({ word: targetWord.word, meaning: targetWord.meaning });
    setOptions(allOptions);
  }, []);

  /**
   * Handle transitioning to the next quiz question.
   * Manages batch switching and triggering prefetching.
   */
  const loadNextQuiz = useCallback(() => {
    if (currentBatch.length === 0) return;

    const newIndex = currentIndex + 1;

    // Check if we need to switch batches (15 words per batch: 5 from each course)
    if (newIndex >= currentBatch.length) {
      if (nextBatch.length > 0) {
        console.log(`Switching to next batch (turn ${turnNumber + 1})`);
        setCurrentBatch(nextBatch);
        setNextBatch([]);
        setCurrentIndex(0);
        setTurnNumber((prev) => prev + 1);
        generateQuiz(nextBatch[0], nextBatch);
      } else {
        // No next batch, fetch new one
        setLoading(true);
      }
      return;
    }

    setCurrentIndex(newIndex);
    generateQuiz(currentBatch[newIndex], currentBatch);
  }, [currentBatch, currentIndex, nextBatch, turnNumber, generateQuiz]);

  // ---------------------------------------------------------------------------
  // Side Effects
  // ---------------------------------------------------------------------------
  /**
   * effect: Initial load
   */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const batch = await fetchBatch();
      if (batch.length > 0) {
        setCurrentBatch(batch);
        setCurrentIndex(0);
        setTurnNumber(1);
        generateQuiz(batch[0], batch);
      }
      setLoading(false);
    };
    init();
  }, [fetchBatch, generateQuiz]);

  /**
   * effect: Keep the next batch prefetched whenever possible
   * Optimized: Starts prefetching at 70% progress for smoother transitions
   */
  useEffect(() => {
    if (loading || isPrefetching) return;
    if (currentBatch.length === 0) return;
    if (nextBatch.length > 0) return;

    // Start prefetching when user reaches 70% of current batch
    const prefetchThreshold = Math.floor(currentBatch.length * 0.7);
    const shouldPrefetch = currentIndex >= prefetchThreshold;

    if (shouldPrefetch) {
      prefetchNextBatch();
    }
  }, [
    loading,
    isPrefetching,
    currentBatch.length,
    currentIndex,
    nextBatch.length,
    prefetchNextBatch,
  ]);

  /**
   * effect: Animate transition when quiz item changes
   */
  useEffect(() => {
    if (quizItem) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [quizItem, fadeAnim]);

  /**
   * effect: Flush buffered stats to Firestore when component unmounts
   */
  useEffect(() => {
    return () => {
      if (user) {
        flushQuizStats(user.uid);
      }
    };
  }, [user, flushQuizStats]);

  // ---------------------------------------------------------------------------
  // TTS Handler
  // ---------------------------------------------------------------------------
  /**
   * Speaks the current quiz word using TTS
   */
  const handleSpeak = useCallback(() => {
    if (quizItem) {
      speakText(quizItem.word, {
        language: "en-US",
        rate: 0.9,
      });
    }
  }, [quizItem, speakText]);

  /**
   * effect: Stop TTS when quiz item changes or component unmounts
   */
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [quizItem, stopSpeech]);

  // ---------------------------------------------------------------------------
  // Interaction Handlers
  // ---------------------------------------------------------------------------
  const handleOptionPress = useCallback(
    (option: string) => {
      if (isCorrect === true || !quizItem) return; // Only lock after correct answer

      const isAnswerCorrect = option === quizItem.meaning;
      setSelectedOption(option);

      // Record quiz answer for accuracy stats
      if (user) {
        bufferQuizAnswer(user.uid, isAnswerCorrect);
      }

      if (isAnswerCorrect) {
        setIsCorrect(true);
        // Auto-advance to next question after brief delay
        setTimeout(() => {
          setSelectedOption(null);
          setIsCorrect(null);
          loadNextQuiz();
        }, 500);
      }
    },
    [isCorrect, quizItem, user, bufferQuizAnswer, loadNextQuiz],
  );

  const handleTimeUp = useCallback(() => {
    if (isCorrect === true || !quizItem) return;

    if (user) {
      bufferQuizAnswer(user.uid, false);
    }

    setSelectedOption(null);
    setIsCorrect(null);
    loadNextQuiz();
  }, [isCorrect, quizItem, user, bufferQuizAnswer, loadNextQuiz]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading || !quizItem) return <PopQuizSkeleton />;

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.popQuiz.title")}
      </ThemedText>
      <View
        style={[
          styles.popQuizCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <View style={styles.popQuizHeader}>
          <View>
            <ThemedText type="subtitle" style={styles.popQuizTitle}>
              {t("dashboard.popQuiz.headline")}
            </ThemedText>
            <ThemedText style={styles.popQuizSubtitle}>
              {t("dashboard.popQuiz.subtitle")}
            </ThemedText>
          </View>
        </View>
        <QuizTimer
          duration={15}
          onTimeUp={handleTimeUp}
          isRunning={isCorrect === null && !loading}
          quizKey={quizKey}
        />

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.popQuizQuestion}>
            <ThemedText style={styles.popQuizQuestionLabel}>
              {t("dashboard.popQuiz.question")}
            </ThemedText>
            <View style={styles.popQuizQuestionRow}>
              <ThemedText style={styles.popQuizQuestionText}>
                {quizItem.word}
              </ThemedText>
              <TouchableOpacity
                onPress={handleSpeak}
                style={[
                  styles.speakerButton,
                  { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                ]}
              >
                <Ionicons
                  name="volume-medium"
                  size={20}
                  color={isDark ? "#aaa" : "#666"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.popQuizOptions}>
            {options.map((option, index) => (
              <PopQuizOption
                key={`${option}-${index}`}
                option={option}
                isSelected={selectedOption === option}
                isCorrect={option === quizItem.meaning}
                isAnswered={isCorrect === true}
                isDark={isDark}
                onPress={handleOptionPress}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface PopQuizOptionProps {
  option: string;
  isSelected: boolean;
  isCorrect: boolean;
  isAnswered: boolean;
  isDark: boolean;
  onPress: (option: string) => void;
}

const PopQuizOption = React.memo(
  ({
    option,
    isSelected,
    isCorrect,
    isAnswered,
    isDark,
    onPress,
  }: PopQuizOptionProps) => {
    return (
      <TouchableOpacity
        style={[
          styles.popQuizOption,
          { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
          isSelected &&
            (isCorrect
              ? styles.popQuizOptionCorrect
              : styles.popQuizOptionIncorrect),
        ]}
        onPress={() => onPress(option)}
        activeOpacity={0.8}
        disabled={isAnswered}
      >
        <ThemedText style={styles.popQuizOptionText}>{option}</ThemedText>
      </TouchableOpacity>
    );
  },
);

PopQuizOption.displayName = "PopQuizOption";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  popQuizCard: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  popQuizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  popQuizTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  popQuizSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  popWordBadge: {
    backgroundColor: "#ffedcc",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  popWordLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    opacity: 0.7,
    marginBottom: 2,
  },
  popWordText: {
    fontSize: 18,
    fontWeight: "700",
  },
  popQuizQuestion: {
    gap: 4,
    marginBottom: 16,
  },
  popQuizQuestionLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  popQuizQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  popQuizQuestionText: {
    fontSize: 24,
    fontWeight: "700",
  },
  speakerButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  popQuizOptions: {
    gap: 8,
  },
  popQuizOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  popQuizOptionText: {
    fontSize: 14,
  },
  popQuizOptionCorrect: {
    borderColor: "#28a745",
    backgroundColor: "#28a74520",
  },
  popQuizOptionIncorrect: {
    borderColor: "#dc3545",
    backgroundColor: "#dc354520",
  },
  popQuizFeedback: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  feedbackContainer: {
    alignItems: "center",
    gap: 10,
  },
  nextButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
