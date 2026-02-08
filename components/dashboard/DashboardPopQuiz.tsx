import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, limit, query } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { getTotalDaysForCourse } from "../../src/services/vocabularyPrefetch";
import { useUserStatsStore, usePopQuizPreferencesStore } from "../../src/stores";
import { CourseType } from "../../src/types/vocabulary";
import { PopQuizType } from "../settings/PopQuizTypeModal";
import { QuizTimer } from "../course/QuizTimer";
import { ThemedText } from "../themed-text";
import { PopQuizSkeleton } from "./PopQuizSkeleton";

/**
 * Get dynamic font size based on text length.
 * Longer collocations/words get smaller fonts to fit properly.
 */
const getDynamicFontSize = (text: string): number => {
  const length = text.length;
  if (length <= 10) return 24;
  if (length <= 15) return 22;
  if (length <= 20) return 20;
  if (length <= 25) return 18;
  if (length <= 30) return 16;
  return 14;
};

// Target courses for pop quiz: CSAT, Collocation, TOEIC, TOEFL, IELTS
const QUIZ_COURSES = [
  { id: "수능", wordsPerCourse: 3 },
  { id: "COLLOCATION", wordsPerCourse: 3 },
  { id: "TOEIC", wordsPerCourse: 3 },
  { id: "TOEFL", wordsPerCourse: 3 },
  { id: "IELTS", wordsPerCourse: 3 },
] as const;

const DEBUG_TOTAL_DAYS_COURSES: CourseType[] = [
  "수능",
  "COLLOCATION",
  "TOEIC",
  "TOEFL",
  "IELTS",
  "OPIC",
  "TOEIC_SPEAKING",
];

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

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  // Batch prefetch state: manages batches of words to minimize database reads
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [nextBatch, setNextBatch] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // Quiz type from store
  const { quizType, isLoaded, loadQuizType } = usePopQuizPreferencesStore();

  // Quiz state: manages the current question and UI interaction
  const [quizItem, setQuizItem] = useState<{
    word: string;
    meaning: string;
    clozeSentence?: string;
    translation?: string;
    example?: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const quizKey = `${turnNumber}-${currentIndex}`;

  // Matching quiz state (for matching type)
  const [matchingWords, setMatchingWords] = useState<string[]>([]);
  const [matchingMeanings, setMatchingMeanings] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  // Word arrangement state (for word-arrangement type)
  const [shuffledChunks, setShuffledChunks] = useState<string[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);

  // Wrong answer tracking: stops quiz after 3 wrong answers
  const [wrongCount, setWrongCount] = useState(0);
  const [isStopped, setIsStopped] = useState(false);

  // ---------------------------------------------------------------------------
  // Animations & Cache
  // ---------------------------------------------------------------------------
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasLoggedTotalDays = useRef(false);

  // Cache for fetched batches (key: "courseId-dayNum", value: word array)
  const batchCache = useRef<Map<string, any[]>>(new Map());
  // Cache for per-course metadata totalDays to avoid repeated Firestore reads
  const totalDaysCache = useRef<Map<string, number>>(new Map());

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

      let totalDays: number;
      const cachedTotalDays = totalDaysCache.current.get(courseId);
      if (typeof cachedTotalDays === "number") {
        totalDays = cachedTotalDays;
        console.log(`[PopQuiz] Using cached totalDays for ${courseId}: ${totalDays}`);
      } else {
        totalDays = await getTotalDaysForCourse(courseId as CourseType);
        totalDaysCache.current.set(courseId, totalDays);
        console.log(`[PopQuiz] Fetched totalDays from Firestore for ${courseId}: ${totalDays}`);
      }

      if (totalDays <= 0) {
        console.log(
          `[PopQuiz] Skipping ${courseId}: totalDays is ${totalDays} (no available days)`,
        );
        return [];
      }

      // Generate random days to try (1-totalDays from Firestore)
      const daysToTry = Array.from({ length: totalDays }, (_, index) => index + 1)
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

  // Load quiz type preference on mount
  useEffect(() => {
    if (!isLoaded) {
      loadQuizType();
    }
  }, [isLoaded, loadQuizType]);

  useEffect(() => {
    if (hasLoggedTotalDays.current) return;
    hasLoggedTotalDays.current = true;

    const logTotalDays = async () => {
      try {
        const entries = await Promise.all(
          DEBUG_TOTAL_DAYS_COURSES.map(async (courseId) => {
            const totalDays = await getTotalDaysForCourse(courseId);
            return [courseId, totalDays] as const;
          }),
        );

        const totals = Object.fromEntries(entries) as Record<CourseType, number>;
        console.log("[PopQuiz][Debug] Course totalDays:", totals);
      } catch (error) {
        console.log("[PopQuiz][Debug] Failed to fetch totalDays:", error);
      }
    };

    void logTotalDays();
  }, []);

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
   * Helper to create a cloze sentence by replacing the target word with a blank
   */
  const createClozeSentence = useCallback((example: string, word: string): string => {
    if (!example || !word) return "";
    // Simple replacement - replace the word with ___
    const regex = new RegExp(`\\b${word}\\w*\\b`, "gi");
    return example.replace(regex, "___");
  }, []);

  /**
   * Helper to tokenize sentence into chunks for word arrangement
   */
  const tokenizeSentence = useCallback((sentence: string): string[] => {
    return sentence.split(/\s+/).filter((chunk) => chunk.length > 0);
  }, []);

  /**
   * Generates a single quiz item from the current batch.
   * Creates distractors from other words in the same batch.
   * Supports multiple quiz types: multiple-choice, fill-in-blank, matching, word-arrangement
   */
  const generateQuiz = useCallback((wordData: any, batch: any[]) => {
    if (batch.length < 4) return;

    const targetWord = wordData;
    const availableWords = batch.filter((w) => w.word !== targetWord.word);

    if (quizType === "multiple-choice") {
      // Multiple choice: Show word, pick meaning from 4 options
      const distractors: string[] = [];
      const shuffledAvailable = [...availableWords].sort(() => Math.random() - 0.5);

      while (distractors.length < 3 && shuffledAvailable.length > 0) {
        distractors.push(shuffledAvailable.shift()!.meaning);
      }

      const allOptions = [...distractors, targetWord.meaning];
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }

      setQuizItem({ word: targetWord.word, meaning: targetWord.meaning });
      setOptions(allOptions);
      setMatchingWords([]);
      setMatchingMeanings([]);
      setShuffledChunks([]);
      setSelectedChunks([]);
    } else if (quizType === "fill-in-blank") {
      // Fill in blank: Show cloze sentence, pick word from 4 options
      const example = targetWord.example || `The word is ${targetWord.word}.`;
      const clozeSentence = createClozeSentence(example, targetWord.word);

      const distractors: string[] = [];
      const shuffledAvailable = [...availableWords].sort(() => Math.random() - 0.5);

      while (distractors.length < 3 && shuffledAvailable.length > 0) {
        distractors.push(shuffledAvailable.shift()!.word);
      }

      const allOptions = [...distractors, targetWord.word];
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }

      setQuizItem({
        word: targetWord.word,
        meaning: targetWord.meaning,
        clozeSentence,
        translation: targetWord.translation,
      });
      setOptions(allOptions);
      setMatchingWords([]);
      setMatchingMeanings([]);
      setShuffledChunks([]);
      setSelectedChunks([]);
    } else if (quizType === "matching") {
      // Matching: Show 4 words and 4 meanings, user matches them
      // Take 4 words from batch (including target)
      const wordsToMatch = [targetWord, ...availableWords.slice(0, 3)];
      const words = wordsToMatch.map((w) => w.word);
      const meanings = wordsToMatch.map((w) => w.meaning);

      // Shuffle meanings
      const shuffledMeanings = [...meanings].sort(() => Math.random() - 0.5);

      setQuizItem({ word: targetWord.word, meaning: targetWord.meaning });
      setMatchingWords(words);
      setMatchingMeanings(shuffledMeanings);
      setOptions([]);
      setMatchedPairs({});
      setSelectedWord(null);
      setSelectedMeaning(null);
      setShuffledChunks([]);
      setSelectedChunks([]);
    } else if (quizType === "word-arrangement") {
      // Word arrangement: Show shuffled chunks, user arranges them
      const example = targetWord.example || targetWord.word;
      const chunks = tokenizeSentence(example);
      const shuffled = [...chunks].sort(() => Math.random() - 0.5);

      setQuizItem({
        word: targetWord.word,
        meaning: targetWord.meaning,
        example,
        translation: targetWord.translation,
      });
      setShuffledChunks(shuffled);
      setSelectedChunks([]);
      setOptions([]);
      setMatchingWords([]);
      setMatchingMeanings([]);
    }
  }, [quizType, createClozeSentence, tokenizeSentence]);

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
        setWrongCount(0); // Reset wrong count for new batch
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
  // Interaction Handlers
  // ---------------------------------------------------------------------------
  const handleOptionPress = useCallback(
    (option: string) => {
      if (isCorrect === true || !quizItem || isStopped) return; // Lock if stopped

      // Determine correctness based on quiz type
      let isAnswerCorrect = false;
      if (quizType === "multiple-choice") {
        isAnswerCorrect = option === quizItem.meaning;
      } else if (quizType === "fill-in-blank") {
        isAnswerCorrect = option.toLowerCase() === quizItem.word.toLowerCase();
      }

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
      } else {
        // Wrong answer - increment count and check if should stop
        const newWrongCount = wrongCount + 1;
        setWrongCount(newWrongCount);
        if (newWrongCount >= 3) {
          setIsStopped(true);
        }
      }
    },
    [
      isCorrect,
      quizItem,
      user,
      bufferQuizAnswer,
      loadNextQuiz,
      wrongCount,
      isStopped,
      quizType,
    ],
  );

  // Matching quiz handlers
  const handleSelectWord = useCallback(
    (word: string) => {
      if (matchedPairs[word] || isStopped) return;
      if (selectedMeaning) {
        // Check if match is correct
        const correctMeaning = quizItem?.meaning;
        const isCorrectMatch = word === quizItem?.word && selectedMeaning === correctMeaning;

        if (user) {
          bufferQuizAnswer(user.uid, isCorrectMatch);
        }

        if (isCorrectMatch) {
          setMatchedPairs((prev) => ({ ...prev, [word]: selectedMeaning }));
          setSelectedWord(null);
          setSelectedMeaning(null);

          // Check if all matched (4 pairs)
          if (Object.keys(matchedPairs).length + 1 >= 4) {
            setTimeout(() => {
              setMatchedPairs({});
              loadNextQuiz();
            }, 500);
          }
        } else {
          // Wrong match
          const newWrongCount = wrongCount + 1;
          setWrongCount(newWrongCount);
          if (newWrongCount >= 3) {
            setIsStopped(true);
          }
          setSelectedWord(null);
          setSelectedMeaning(null);
        }
        return;
      }
      setSelectedWord(word);
    },
    [matchedPairs, selectedMeaning, quizItem, user, bufferQuizAnswer, wrongCount, isStopped, loadNextQuiz],
  );

  const handleSelectMeaning = useCallback(
    (meaning: string) => {
      if (Object.values(matchedPairs).includes(meaning) || isStopped) return;
      if (selectedWord) {
        // Check if match is correct
        const correctMeaning = quizItem?.meaning;
        const isCorrectMatch = selectedWord === quizItem?.word && meaning === correctMeaning;

        if (user) {
          bufferQuizAnswer(user.uid, isCorrectMatch);
        }

        if (isCorrectMatch) {
          setMatchedPairs((prev) => ({ ...prev, [selectedWord]: meaning }));
          setSelectedWord(null);
          setSelectedMeaning(null);

          // Check if all matched (4 pairs)
          if (Object.keys(matchedPairs).length + 1 >= 4) {
            setTimeout(() => {
              setMatchedPairs({});
              loadNextQuiz();
            }, 500);
          }
        } else {
          // Wrong match
          const newWrongCount = wrongCount + 1;
          setWrongCount(newWrongCount);
          if (newWrongCount >= 3) {
            setIsStopped(true);
          }
          setSelectedWord(null);
          setSelectedMeaning(null);
        }
        return;
      }
      setSelectedMeaning(meaning);
    },
    [matchedPairs, selectedWord, quizItem, user, bufferQuizAnswer, wrongCount, isStopped, loadNextQuiz],
  );

  // Word arrangement handlers
  const handleChunkSelect = useCallback(
    (chunk: string, index: number) => {
      if (isStopped) return;
      const newShuffled = [...shuffledChunks];
      newShuffled.splice(index, 1);
      setShuffledChunks(newShuffled);
      setSelectedChunks((prev) => [...prev, chunk]);

      // Check if arrangement is complete
      if (newShuffled.length === 0) {
        const userSentence = [...selectedChunks, chunk].join(" ");
        const correctSentence = quizItem?.example || "";
        const isCorrectArrangement = userSentence.trim() === correctSentence.trim();

        if (user) {
          bufferQuizAnswer(user.uid, isCorrectArrangement);
        }

        if (isCorrectArrangement) {
          setTimeout(() => {
            setSelectedChunks([]);
            loadNextQuiz();
          }, 500);
        } else {
          const newWrongCount = wrongCount + 1;
          setWrongCount(newWrongCount);
          if (newWrongCount >= 3) {
            setIsStopped(true);
          } else {
            // Reset arrangement for retry
            setTimeout(() => {
              const example = quizItem?.example || "";
              const chunks = example.split(/\s+/).filter((c) => c.length > 0);
              setShuffledChunks([...chunks].sort(() => Math.random() - 0.5));
              setSelectedChunks([]);
            }, 1000);
          }
        }
      }
    },
    [shuffledChunks, selectedChunks, quizItem, user, bufferQuizAnswer, wrongCount, isStopped, loadNextQuiz],
  );

  const handleChunkDeselect = useCallback(
    (index: number) => {
      if (isStopped) return;
      const chunk = selectedChunks[index];
      if (!chunk) return;

      const newSelected = [...selectedChunks];
      newSelected.splice(index, 1);
      setSelectedChunks(newSelected);
      setShuffledChunks((prev) => [...prev, chunk]);
    },
    [selectedChunks, isStopped],
  );

  const handleTimeUp = useCallback(() => {
    if (isCorrect === true || !quizItem || isStopped) return;

    if (user) {
      bufferQuizAnswer(user.uid, false);
    }

    // Time up counts as wrong answer
    const newWrongCount = wrongCount + 1;
    setWrongCount(newWrongCount);
    if (newWrongCount >= 3) {
      setIsStopped(true);
      return;
    }

    setSelectedOption(null);
    setIsCorrect(null);
    loadNextQuiz();
  }, [
    isCorrect,
    quizItem,
    user,
    bufferQuizAnswer,
    loadNextQuiz,
    wrongCount,
    isStopped,
  ]);

  /**
   * Restart the quiz after being stopped due to 3 wrong answers.
   * Resets wrong count and continues with the next question.
   */
  const handleRestart = useCallback(() => {
    setWrongCount(0);
    setIsStopped(false);
    setSelectedOption(null);
    setIsCorrect(null);
    loadNextQuiz();
  }, [loadNextQuiz]);

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
          isRunning={isCorrect === null && !loading && !isStopped}
          quizKey={quizKey}
        />

        {isStopped ? (
          // Stopped state - show restart button
          <View style={styles.stoppedContainer}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={isDark ? "#ff6b6b" : "#dc3545"}
            />
            <ThemedText style={styles.stoppedTitle}>
              {t("dashboard.popQuiz.stoppedTitle", {
                defaultValue: "Quiz Paused",
              })}
            </ThemedText>
            <ThemedText style={styles.stoppedSubtitle}>
              {t("dashboard.popQuiz.stoppedSubtitle", {
                defaultValue: "You got 3 wrong answers",
              })}
            </ThemedText>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleRestart}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <ThemedText style={styles.startButtonText}>
                {t("dashboard.popQuiz.startButton", { defaultValue: "Start" })}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {quizType === "multiple-choice" && (
              <>
                <View style={styles.popQuizQuestion}>
                  <ThemedText style={styles.popQuizQuestionLabel}>
                    {t("dashboard.popQuiz.question")}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.popQuizQuestionText,
                      { fontSize: getDynamicFontSize(quizItem.word) },
                    ]}
                  >
                    {quizItem.word}
                  </ThemedText>
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
              </>
            )}

            {quizType === "fill-in-blank" && (
              <>
                <View style={styles.popQuizQuestion}>
                  <ThemedText style={styles.popQuizQuestionLabel}>
                    {t("dashboard.popQuiz.fillInBlank", {
                      defaultValue: "Complete the sentence",
                    })}
                  </ThemedText>
                  <ThemedText style={styles.popQuizClozeSentence}>
                    {quizItem.clozeSentence}
                  </ThemedText>
                  {quizItem.translation && (
                    <ThemedText style={styles.popQuizTranslation}>
                      {quizItem.translation}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.popQuizOptions}>
                  {options.map((option, index) => (
                    <PopQuizOption
                      key={`${option}-${index}`}
                      option={option}
                      isSelected={selectedOption === option}
                      isCorrect={option.toLowerCase() === quizItem.word.toLowerCase()}
                      isAnswered={isCorrect === true}
                      isDark={isDark}
                      onPress={handleOptionPress}
                    />
                  ))}
                </View>
              </>
            )}

            {quizType === "matching" && (
              <>
                <View style={styles.popQuizQuestion}>
                  <ThemedText style={styles.popQuizQuestionLabel}>
                    {t("dashboard.popQuiz.matching", {
                      defaultValue: "Match words with meanings",
                    })}
                  </ThemedText>
                  <ThemedText style={styles.popQuizSubtext}>
                    {t("dashboard.popQuiz.matchingHint", {
                      defaultValue: "Tap a word, then tap its meaning",
                    })}
                  </ThemedText>
                </View>

                <View style={styles.matchingContainer}>
                  <View style={styles.matchingColumn}>
                    <ThemedText style={styles.matchingColumnLabel}>
                      {t("dashboard.popQuiz.words", { defaultValue: "Words" })}
                    </ThemedText>
                    {matchingWords.map((word) => (
                      <TouchableOpacity
                        key={word}
                        style={[
                          styles.matchingItem,
                          { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                          selectedWord === word && styles.matchingItemSelected,
                          matchedPairs[word] && styles.matchingItemMatched,
                        ]}
                        onPress={() => handleSelectWord(word)}
                        disabled={!!matchedPairs[word]}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.matchingItemText}>
                          {word}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.matchingColumn}>
                    <ThemedText style={styles.matchingColumnLabel}>
                      {t("dashboard.popQuiz.meanings", {
                        defaultValue: "Meanings",
                      })}
                    </ThemedText>
                    {matchingMeanings.map((meaning) => (
                      <TouchableOpacity
                        key={meaning}
                        style={[
                          styles.matchingItem,
                          { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                          selectedMeaning === meaning &&
                            styles.matchingItemSelected,
                          Object.values(matchedPairs).includes(meaning) &&
                            styles.matchingItemMatched,
                        ]}
                        onPress={() => handleSelectMeaning(meaning)}
                        disabled={Object.values(matchedPairs).includes(meaning)}
                        activeOpacity={0.7}
                      >
                        <ThemedText
                          style={styles.matchingItemText}
                          numberOfLines={2}
                        >
                          {meaning}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {quizType === "word-arrangement" && (
              <>
                <View style={styles.popQuizQuestion}>
                  <ThemedText style={styles.popQuizQuestionLabel}>
                    {t("dashboard.popQuiz.wordArrangement", {
                      defaultValue: "Arrange the words",
                    })}
                  </ThemedText>
                  <ThemedText style={styles.popQuizWordMeaning}>
                    {quizItem.word}: {quizItem.meaning}
                  </ThemedText>
                  {quizItem.translation && (
                    <ThemedText style={styles.popQuizTranslation}>
                      {quizItem.translation}
                    </ThemedText>
                  )}
                </View>

                {/* Selected chunks area */}
                <View style={styles.arrangementArea}>
                  <ThemedText style={styles.arrangementLabel}>
                    {t("dashboard.popQuiz.yourAnswer", {
                      defaultValue: "Your answer:",
                    })}
                  </ThemedText>
                  <View style={styles.selectedChunksContainer}>
                    {selectedChunks.length === 0 ? (
                      <ThemedText style={styles.arrangementPlaceholder}>
                        {t("dashboard.popQuiz.tapWordsBelow", {
                          defaultValue: "Tap words below to arrange",
                        })}
                      </ThemedText>
                    ) : (
                      selectedChunks.map((chunk, index) => (
                        <TouchableOpacity
                          key={`selected-${index}`}
                          style={[
                            styles.chunk,
                            styles.selectedChunk,
                            { backgroundColor: isDark ? "#007AFF" : "#007AFF" },
                          ]}
                          onPress={() => handleChunkDeselect(index)}
                        >
                          <ThemedText style={styles.selectedChunkText}>
                            {chunk}
                          </ThemedText>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </View>

                {/* Available chunks */}
                <View style={styles.arrangementArea}>
                  <ThemedText style={styles.arrangementLabel}>
                    {t("dashboard.popQuiz.availableWords", {
                      defaultValue: "Available words:",
                    })}
                  </ThemedText>
                  <View style={styles.shuffledChunksContainer}>
                    {shuffledChunks.map((chunk, index) => (
                      <TouchableOpacity
                        key={`shuffled-${index}`}
                        style={[
                          styles.chunk,
                          { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                        ]}
                        onPress={() => handleChunkSelect(chunk, index)}
                      >
                        <ThemedText style={styles.chunkText}>{chunk}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        )}
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
  stoppedContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  stoppedTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  stoppedSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  popQuizClozeSentence: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
    marginVertical: 8,
  },
  popQuizTranslation: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 8,
  },
  popQuizSubtext: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  popQuizWordMeaning: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 8,
  },
  matchingContainer: {
    flexDirection: "row",
    gap: 12,
  },
  matchingColumn: {
    flex: 1,
    gap: 8,
  },
  matchingColumnLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  matchingItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 48,
    justifyContent: "center",
  },
  matchingItemSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF20",
  },
  matchingItemMatched: {
    borderColor: "#28a745",
    backgroundColor: "#28a74520",
    opacity: 0.5,
  },
  matchingItemText: {
    fontSize: 13,
  },
  arrangementArea: {
    marginBottom: 16,
  },
  arrangementLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  selectedChunksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minHeight: 60,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF40",
    borderStyle: "dashed",
  },
  shuffledChunksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  arrangementPlaceholder: {
    fontSize: 14,
    opacity: 0.4,
    fontStyle: "italic",
  },
  chunk: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedChunk: {
    borderColor: "#007AFF",
  },
  chunkText: {
    fontSize: 14,
  },
  selectedChunkText: {
    fontSize: 14,
    color: "#fff",
  },
});
