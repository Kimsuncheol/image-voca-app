/**
 * ====================================
 * DASHBOARD POP QUIZ COMPONENT
 * ====================================
 *
 * Orchestrator component for the pop quiz feature on the dashboard.
 * Features:
 * - Fetches random vocabulary words from various courses
 * - JLPT: rotates through multiple-choice, matching, and fill-in-blank
 * - English courses: multiple-choice only
 * - Manages batching and prefetching for infinite play
 * - Tracks user answers and updates statistics
 *
 * This component has been modularized into smaller focused pieces:
 * - hooks/useQuizBatchFetcher.ts: Data fetching and caching logic
 * - utils/quizHelpers.ts: Helper functions
 * - constants/quizConfig.ts: Configuration constants
 * - quiz-types/MultipleChoiceQuiz.tsx: Multiple choice renderer
 * - quiz-types/MatchingQuiz.tsx: Matching quiz renderer (JLPT only)
 * - quiz-types/FillInBlankQuiz.tsx: Fill-in-blank renderer (JLPT only)
 * - QuizHeader.tsx, QuizStoppedState.tsx: Shared UI components
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getTotalDaysForCourse } from "../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../src/stores";
import { CourseType } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";
import {
  getDebugTotalDaysCourses,
  getQuizCoursesForLanguage,
} from "./constants/quizConfig";
import { useQuizBatchFetcher } from "./hooks/useQuizBatchFetcher";
import { PopQuizSkeleton } from "./PopQuizSkeleton";
import { FillInBlankQuiz } from "./quiz-types/FillInBlankQuiz";
import { MatchingPair, MatchingQuiz } from "./quiz-types/MatchingQuiz";
import { MultipleChoiceQuiz } from "./quiz-types/MultipleChoiceQuiz";
import { QuizHeader } from "./QuizHeader";
import { QuizStoppedState } from "./QuizStoppedState";
import { createClozeSentence } from "./utils/quizHelpers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type QuizType = "multiple-choice" | "matching" | "fill-in-blank";

interface QuizItem {
  word: string;
  meaning: string;
  example?: string; // cloze sentence for fill-in-blank
}

const JLPT_QUIZ_TYPES: QuizType[] = [
  "multiple-choice",
  "matching",
  "fill-in-blank",
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function DashboardPopQuiz() {
  // ==========================================================================
  // HOOKS & CONTEXT
  // ==========================================================================
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { learningLanguage } = useLearningLanguage();
  const { bufferQuizAnswer, flushQuizStats } = useUserStatsStore();
  const courseConfigs = useMemo(
    () => getQuizCoursesForLanguage(learningLanguage),
    [learningLanguage],
  );
  const debugCourseIds = useMemo(
    () => getDebugTotalDaysCourses(learningLanguage),
    [learningLanguage],
  );

  // ==========================================================================
  // CUSTOM HOOKS
  // ==========================================================================
  const { fetchBatch, prefetchNextBatch, isPrefetching } =
    useQuizBatchFetcher(courseConfigs);

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  // Batch state
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [nextBatch, setNextBatch] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);

  // Quiz state
  const [quizType, setQuizType] = useState<QuizType>("multiple-choice");
  const [quizItem, setQuizItem] = useState<QuizItem | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Wrong answer tracking
  const [wrongCount, setWrongCount] = useState(0);
  const [isStopped, setIsStopped] = useState(false);

  // ==========================================================================
  // REFS
  // ==========================================================================
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const batchLoadVersionRef = useRef(0);
  const quizTypeIndexRef = useRef(0);

  // Derived state
  const quizKey = `${turnNumber}-${currentIndex}`;

  // ==========================================================================
  // MEANING RESOLUTION
  // ==========================================================================
  /**
   * Resolves the correct localized meaning from raw Firestore word data.
   * JLPT words have meaningEnglish / meaningKorean flat fields.
   * Other courses have a single meaning field.
   */
  const resolveMeaning = useCallback(
    (wordData: any): string => {
      if (wordData.meaningEnglish !== undefined) {
        return i18n.language === "ko"
          ? (wordData.meaningKorean ?? wordData.meaningEnglish)
          : wordData.meaningEnglish;
      }
      return wordData.meaning ?? "";
    },
    [i18n.language],
  );

  // ==========================================================================
  // QUIZ GENERATION
  // ==========================================================================
  /**
   * Generates a quiz item from the current word.
   * For JLPT (learningLanguage === "ja"): rotates between multiple-choice,
   * matching, and fill-in-blank.
   * For other courses: always multiple-choice.
   */
  const generateQuiz = useCallback(
    (wordData: any, batch: any[]) => {
      if (batch.length < 4) return;

      const targetWord = wordData;
      const availableWords = batch.filter((w) => w.word !== targetWord.word);
      const shuffledAvailable = [...availableWords].sort(
        () => Math.random() - 0.5,
      );
      const targetMeaning = resolveMeaning(targetWord);

      // Determine quiz type
      let nextQuizType: QuizType;
      if (learningLanguage === "ja") {
        nextQuizType =
          JLPT_QUIZ_TYPES[quizTypeIndexRef.current % JLPT_QUIZ_TYPES.length];
        quizTypeIndexRef.current += 1;
      } else {
        nextQuizType = "multiple-choice";
      }
      setQuizType(nextQuizType);

      if (nextQuizType === "matching") {
        const otherPairs: MatchingPair[] = shuffledAvailable
          .slice(0, 3)
          .map((w) => ({ word: w.word, meaning: resolveMeaning(w) }));
        const allPairs: MatchingPair[] = [
          { word: targetWord.word, meaning: targetMeaning },
          ...otherPairs,
        ].sort(() => Math.random() - 0.5);
        setMatchingPairs(allPairs);
        setQuizItem({ word: targetWord.word, meaning: targetMeaning });
        setOptions([]);
      } else if (nextQuizType === "fill-in-blank") {
        const cloze = createClozeSentence(
          targetWord.example ?? "",
          targetWord.word,
        );
        const distractors = shuffledAvailable.slice(0, 3).map((w) => w.word);
        const wordOptions = [...distractors, targetWord.word].sort(
          () => Math.random() - 0.5,
        );
        setQuizItem({ word: targetWord.word, meaning: targetMeaning, example: cloze });
        setOptions(wordOptions);
        setMatchingPairs([]);
      } else {
        // Multiple choice: show word, pick meaning
        const distractors: string[] = [];
        const remaining = [...shuffledAvailable];
        while (distractors.length < 3 && remaining.length > 0) {
          distractors.push(resolveMeaning(remaining.shift()!));
        }
        const allOptions = [...distractors, targetMeaning];
        for (let i = allOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }
        setQuizItem({ word: targetWord.word, meaning: targetMeaning });
        setOptions(allOptions);
        setMatchingPairs([]);
      }
    },
    [learningLanguage, resolveMeaning],
  );

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  /**
   * Handle transitioning to the next quiz question.
   * Manages batch switching and triggering prefetching.
   */
  const loadNextQuiz = useCallback(() => {
    if (currentBatch.length === 0) return;

    const newIndex = currentIndex + 1;

    // Check if we need to switch batches
    if (newIndex >= currentBatch.length) {
      if (nextBatch.length > 0) {
        console.log(`Switching to next batch (turn ${turnNumber + 1})`);
        setCurrentBatch(nextBatch);
        setNextBatch([]);
        setCurrentIndex(0);
        setTurnNumber((prev) => prev + 1);
        setWrongCount(0);
        quizTypeIndexRef.current = 0;
        generateQuiz(nextBatch[0], nextBatch);
      } else {
        setLoading(true);
      }
      return;
    }

    setCurrentIndex(newIndex);
    generateQuiz(currentBatch[newIndex], currentBatch);
    setWrongCount(0);
  }, [currentBatch, currentIndex, nextBatch, turnNumber, generateQuiz]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
  const handleOptionPress = useCallback(
    (option: string) => {
      if (isCorrect === true || !quizItem || isStopped) return;

      const isAnswerCorrect =
        quizType === "fill-in-blank"
          ? option === quizItem.word
          : option === quizItem.meaning;

      setSelectedOption(option);

      if (user) {
        bufferQuizAnswer(user.uid, isAnswerCorrect);
      }

      if (isAnswerCorrect) {
        setIsCorrect(true);
        setTimeout(() => {
          setSelectedOption(null);
          setIsCorrect(null);
          loadNextQuiz();
        }, 500);
      } else {
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
      quizType,
      user,
      bufferQuizAnswer,
      loadNextQuiz,
      wrongCount,
      isStopped,
    ],
  );

  const handleMatchingComplete = useCallback(() => {
    if (user) {
      bufferQuizAnswer(user.uid, true);
    }
    setTimeout(() => {
      setSelectedOption(null);
      setIsCorrect(null);
      loadNextQuiz();
    }, 200);
  }, [user, bufferQuizAnswer, loadNextQuiz]);

  const handleMatchingWrong = useCallback(() => {
    if (user) {
      bufferQuizAnswer(user.uid, false);
    }
    const newWrongCount = wrongCount + 1;
    setWrongCount(newWrongCount);
    if (newWrongCount >= 3) {
      setIsStopped(true);
    }
  }, [user, bufferQuizAnswer, wrongCount]);

  const handleTimeUp = useCallback(() => {
    if (isCorrect === true || !quizItem || isStopped) return;

    if (user) {
      bufferQuizAnswer(user.uid, false);
    }

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

  const handleRestart = useCallback(() => {
    setWrongCount(0);
    setIsStopped(false);
    setSelectedOption(null);
    setIsCorrect(null);
    loadNextQuiz();
  }, [loadNextQuiz]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  // Debug: Log total days for courses
  useEffect(() => {
    let isActive = true;

    const logTotalDays = async () => {
      try {
        const entries = await Promise.all(
          debugCourseIds.map(async (courseId) => {
            const totalDays = await getTotalDaysForCourse(courseId);
            return [courseId, totalDays] as const;
          }),
        );

        if (!isActive) return;

        const totals = Object.fromEntries(entries) as Record<
          CourseType,
          number
        >;
        console.log(`[PopQuiz][Debug][${learningLanguage}] Course totalDays:`, totals);
      } catch (error) {
        console.log("[PopQuiz][Debug] Failed to fetch totalDays:", error);
      }
    };

    void logTotalDays();
    return () => {
      isActive = false;
    };
  }, [debugCourseIds, learningLanguage]);

  // Initial load and language changes
  useEffect(() => {
    const loadVersion = batchLoadVersionRef.current + 1;
    batchLoadVersionRef.current = loadVersion;

    const init = async () => {
      setLoading(true);
      setCurrentBatch([]);
      setNextBatch([]);
      setCurrentIndex(0);
      setTurnNumber(1);
      setQuizItem(null);
      setOptions([]);
      setMatchingPairs([]);
      setSelectedOption(null);
      setIsCorrect(null);
      setWrongCount(0);
      setIsStopped(false);
      quizTypeIndexRef.current = 0;

      const batch = await fetchBatch();
      if (batchLoadVersionRef.current !== loadVersion) {
        return;
      }

      if (batch.length > 0) {
        setCurrentBatch(batch);
        setCurrentIndex(0);
        setTurnNumber(1);
        generateQuiz(batch[0], batch);
      }
      setLoading(false);
    };
    void init();
  }, [fetchBatch, generateQuiz, learningLanguage]);

  // Prefetch next batch when reaching 70% of current batch
  useEffect(() => {
    if (loading || isPrefetching) return;
    if (currentBatch.length === 0) return;
    if (nextBatch.length > 0) return;

    const prefetchThreshold = Math.floor(currentBatch.length * 0.7);
    const shouldPrefetch = currentIndex >= prefetchThreshold;

    if (shouldPrefetch) {
      const loadVersion = batchLoadVersionRef.current;
      prefetchNextBatch().then((batch) => {
        if (batchLoadVersionRef.current !== loadVersion) {
          return;
        }
        if (batch.length > 0) {
          setNextBatch(batch);
        }
      });
    }
  }, [
    loading,
    isPrefetching,
    currentBatch.length,
    currentIndex,
    nextBatch.length,
    prefetchNextBatch,
  ]);

  // Animate transition when quiz item changes
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

  // Flush buffered stats on unmount
  useEffect(() => {
    return () => {
      if (user) {
        flushQuizStats(user.uid);
      }
    };
  }, [user, flushQuizStats]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loading || !quizItem) return <PopQuizSkeleton />;

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.popQuiz.title")}
      </ThemedText>
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <QuizHeader
          title={t("dashboard.popQuiz.headline")}
          subtitle={t("dashboard.popQuiz.subtitle")}
          timerDuration={15}
          isTimerRunning={
            quizType !== "matching" &&
            isCorrect === null &&
            !loading &&
            !isStopped
          }
          quizKey={quizKey}
          onTimeUp={handleTimeUp}
        />

        {isStopped ? (
          <QuizStoppedState
            title={t("dashboard.popQuiz.stoppedTitle", {
              defaultValue: "Quiz Paused",
            })}
            subtitle={t("dashboard.popQuiz.stoppedSubtitle", {
              defaultValue: "You got 3 wrong answers",
            })}
            buttonText={t("dashboard.popQuiz.startButton", {
              defaultValue: "Start",
            })}
            isDark={isDark}
            onRestart={handleRestart}
          />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {quizType === "matching" && (
              <MatchingQuiz
                pairs={matchingPairs}
                isDark={isDark}
                onComplete={handleMatchingComplete}
                onWrong={handleMatchingWrong}
              />
            )}
            {quizType === "fill-in-blank" && quizItem.example !== undefined && (
              <FillInBlankQuiz
                clozeSentence={quizItem.example}
                options={options}
                correctWord={quizItem.word}
                selectedOption={selectedOption}
                isCorrect={isCorrect}
                isDark={isDark}
                onOptionPress={handleOptionPress}
              />
            )}
            {quizType === "multiple-choice" && (
              <MultipleChoiceQuiz
                quizItem={quizItem}
                options={options}
                selectedOption={selectedOption}
                isCorrect={isCorrect}
                isDark={isDark}
                onOptionPress={handleOptionPress}
              />
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
});
