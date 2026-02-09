/**
 * ====================================
 * DASHBOARD POP QUIZ COMPONENT
 * ====================================
 *
 * Orchestrator component for the pop quiz feature on the dashboard.
 * Features:
 * - Fetches random vocabulary words from various courses
 * - Supports multiple-choice quiz type only
 * - Manages batching and prefetching for infinite play
 * - Tracks user answers and updates statistics
 *
 * This component has been modularized into smaller focused pieces:
 * - hooks/useQuizBatchFetcher.ts: Data fetching and caching logic
 * - utils/quizHelpers.ts: Helper functions
 * - constants/quizConfig.ts: Configuration constants
 * - quiz-types/MultipleChoiceQuiz.tsx: Quiz type renderer
 * - QuizHeader.tsx, QuizStoppedState.tsx: Shared UI components
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getTotalDaysForCourse } from "../../src/services/vocabularyPrefetch";
import {
  usePopQuizPreferencesStore,
  useUserStatsStore,
} from "../../src/stores";
import { CourseType } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";
import { DEBUG_TOTAL_DAYS_COURSES } from "./constants/quizConfig";
import { useQuizBatchFetcher } from "./hooks/useQuizBatchFetcher";
import { PopQuizSkeleton } from "./PopQuizSkeleton";
import { MultipleChoiceQuiz } from "./quiz-types/MultipleChoiceQuiz";
import { QuizHeader } from "./QuizHeader";
import { QuizStoppedState } from "./QuizStoppedState";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface QuizItem {
  word: string;
  meaning: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function DashboardPopQuiz() {
  // ==========================================================================
  // HOOKS & CONTEXT
  // ==========================================================================
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bufferQuizAnswer, flushQuizStats } = useUserStatsStore();
  const { isLoaded, loadQuizType } = usePopQuizPreferencesStore();

  // ==========================================================================
  // CUSTOM HOOKS
  // ==========================================================================
  const { fetchBatch, prefetchNextBatch, isPrefetching } =
    useQuizBatchFetcher();

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  // Batch state
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [nextBatch, setNextBatch] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);

  // Quiz state
  const [quizItem, setQuizItem] = useState<QuizItem | null>(null);
  const [options, setOptions] = useState<string[]>([]);
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
  const hasLoggedTotalDays = useRef(false);

  // Derived state
  const quizKey = `${turnNumber}-${currentIndex}`;

  // ==========================================================================
  // QUIZ GENERATION
  // ==========================================================================
  /**
   * Generates a single multiple-choice quiz item from the current batch.
   * Creates distractors from other words in the same batch.
   */
  const generateQuiz = useCallback((wordData: any, batch: any[]) => {
    if (batch.length < 4) return;

    const targetWord = wordData;
    const availableWords = batch.filter((w) => w.word !== targetWord.word);

    // Multiple choice: Show word, pick meaning from 4 options
    const distractors: string[] = [];
    const shuffledAvailable = [...availableWords].sort(
      () => Math.random() - 0.5,
    );

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
  }, []);

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

      const isAnswerCorrect = option === quizItem.meaning;
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
      user,
      bufferQuizAnswer,
      loadNextQuiz,
      wrongCount,
      isStopped,
    ],
  );

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
  // Load quiz type preference on mount
  useEffect(() => {
    if (!isLoaded) {
      loadQuizType();
    }
  }, [isLoaded, loadQuizType]);

  // Debug: Log total days for courses
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

        const totals = Object.fromEntries(entries) as Record<
          CourseType,
          number
        >;
        console.log("[PopQuiz][Debug] Course totalDays:", totals);
      } catch (error) {
        console.log("[PopQuiz][Debug] Failed to fetch totalDays:", error);
      }
    };

    void logTotalDays();
  }, []);

  // Initial load
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

  // Prefetch next batch when reaching 70% of current batch
  useEffect(() => {
    if (loading || isPrefetching) return;
    if (currentBatch.length === 0) return;
    if (nextBatch.length > 0) return;

    const prefetchThreshold = Math.floor(currentBatch.length * 0.7);
    const shouldPrefetch = currentIndex >= prefetchThreshold;

    if (shouldPrefetch) {
      prefetchNextBatch().then((batch) => {
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
          isTimerRunning={isCorrect === null && !loading && !isStopped}
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
            <MultipleChoiceQuiz
              quizItem={quizItem}
              options={options}
              selectedOption={selectedOption}
              isCorrect={isCorrect}
              isDark={isDark}
              onOptionPress={handleOptionPress}
            />
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
