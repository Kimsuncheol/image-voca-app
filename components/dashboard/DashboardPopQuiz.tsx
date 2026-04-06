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
import { QuizGenerationAnimation } from "../common/QuizGenerationAnimation";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getTotalDaysForCourse } from "../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../src/stores";
import { CourseType } from "../../src/types/vocabulary";
import {
  resolveQuizVocabulary,
} from "../../src/utils/localizedVocabulary";
import { ThemedText } from "../themed-text";
import {
  getDebugTotalDaysCourses,
  getQuizCoursesForLanguage,
} from "./constants/quizConfig";
import { useQuizBatchFetcher } from "./hooks/useQuizBatchFetcher";
import { FillInBlankQuiz, WordOption } from "./quiz-types/FillInBlankQuiz";
import { MatchingPair, MatchingQuiz } from "./quiz-types/MatchingQuiz";
import { MultipleChoiceQuiz } from "./quiz-types/MultipleChoiceQuiz";
import { QuizHeader } from "./QuizHeader";
import { QuizStoppedState } from "./QuizStoppedState";
import {
  buildDashboardQuizPayload,
  type ResolvedDashboardQuizVocabulary,
  DashboardQuizItem as QuizItem,
  DashboardQuizType as QuizType,
} from "./utils/quizHelpers";
import { normalizeSynonyms } from "../../src/utils/synonyms";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
const JLPT_QUIZ_TYPES: QuizType[] = [
  "multiple-choice",
  "matching",
  "fill-in-blank",
];
const INITIAL_LOADING_MIN_MS = 500;
const ROLLOVER_LOADING_DELAY_MS = 150;
const ROLLOVER_LOADING_MIN_MS = 500;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
  const [currentBatch, setCurrentBatch] = useState<ResolvedDashboardQuizVocabulary[]>([]);
  const [nextBatch, setNextBatch] = useState<ResolvedDashboardQuizVocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);

  // Quiz state
  const [quizType, setQuizType] = useState<QuizType>("multiple-choice");
  const [quizItem, setQuizItem] = useState<QuizItem | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [wordOptions, setWordOptions] = useState<WordOption[]>([]);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Wrong answer tracking
  const [wrongCount, setWrongCount] = useState(0);
  const [isStopped, setIsStopped] = useState(false);
  const [waitingForNextBatch, setWaitingForNextBatch] = useState(false);
  const [rolloverLoadingVisible, setRolloverLoadingVisible] = useState(false);

  // ==========================================================================
  // REFS
  // ==========================================================================
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const batchLoadVersionRef = useRef(0);
  const quizTypeIndexRef = useRef(0);
  const rolloverDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rolloverLoadingStartedAtRef = useRef<number | null>(null);

  // Incremented on each correct pair match to reset the timer mid-question
  const [matchCount, setMatchCount] = useState(0);

  // Derived state
  const quizKey = `${turnNumber}-${currentIndex}-${matchCount}`;

  // ==========================================================================
  // VOCABULARY RESOLUTION
  // ==========================================================================
  const resolveBatch = useCallback(
    (batch: any[]): ResolvedDashboardQuizVocabulary[] =>
      batch.map((word) => ({
        ...resolveQuizVocabulary(word, i18n.language),
        course: word.course,
        synonyms: normalizeSynonyms(word.synonyms),
      })),
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
    (
      wordData: ResolvedDashboardQuizVocabulary,
      batch: ResolvedDashboardQuizVocabulary[],
    ) => {
      // Determine quiz type
      let nextQuizType: QuizType;
      if (learningLanguage === "ja") {
        nextQuizType =
          JLPT_QUIZ_TYPES[quizTypeIndexRef.current % JLPT_QUIZ_TYPES.length];
        quizTypeIndexRef.current += 1;
      } else if (
        wordData.course === "TOEFL_IELTS" &&
        normalizeSynonyms(wordData.synonyms).length > 0 &&
        buildDashboardQuizPayload(wordData, batch, "synonym-matching")
      ) {
        nextQuizType = "synonym-matching";
      } else {
        nextQuizType = "multiple-choice";
      }
      setQuizType(nextQuizType);

      const payload = buildDashboardQuizPayload(wordData, batch, nextQuizType);
      if (!payload) return;

      setQuizItem(payload.quizItem);
      setOptions(payload.options);
      setWordOptions(payload.wordOptions);
      setMatchingPairs(payload.matchingPairs);
    },
    [learningLanguage],
  );

  const clearRolloverDelayTimer = useCallback(() => {
    if (!rolloverDelayTimerRef.current) return;
    clearTimeout(rolloverDelayTimerRef.current);
    rolloverDelayTimerRef.current = null;
  }, []);

  const applyNextBatch = useCallback(
    (resolvedBatch: ResolvedDashboardQuizVocabulary[]) => {
      clearRolloverDelayTimer();
      rolloverLoadingStartedAtRef.current = null;
      setWaitingForNextBatch(false);
      setRolloverLoadingVisible(false);
      setCurrentBatch(resolvedBatch);
      setNextBatch([]);
      setCurrentIndex(0);
      setTurnNumber((prev) => prev + 1);
      setWrongCount(0);
      quizTypeIndexRef.current = 0;
      generateQuiz(resolvedBatch[0], resolvedBatch);
    },
    [clearRolloverDelayTimer, generateQuiz],
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
        applyNextBatch(nextBatch);
      } else {
        setWaitingForNextBatch(true);
        clearRolloverDelayTimer();
        rolloverDelayTimerRef.current = setTimeout(() => {
          rolloverLoadingStartedAtRef.current = Date.now();
          setRolloverLoadingVisible(true);
        }, ROLLOVER_LOADING_DELAY_MS);

        if (!isPrefetching) {
          const loadVersion = batchLoadVersionRef.current;
          void prefetchNextBatch().then((batch) => {
            if (batchLoadVersionRef.current !== loadVersion) {
              return;
            }
            const resolvedBatch = resolveBatch(batch);
            if (resolvedBatch.length > 0) {
              setNextBatch(resolvedBatch);
            }
          });
        }
      }
      return;
    }

    setCurrentIndex(newIndex);
    generateQuiz(currentBatch[newIndex], currentBatch);
    setWrongCount(0);
  }, [
    applyNextBatch,
    clearRolloverDelayTimer,
    currentBatch,
    currentIndex,
    generateQuiz,
    isPrefetching,
    nextBatch,
    prefetchNextBatch,
    resolveBatch,
    turnNumber,
  ]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
  const handleOptionPress = useCallback(
    (option: string) => {
      if (isCorrect === true || !quizItem || isStopped || waitingForNextBatch) {
        return;
      }

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
      waitingForNextBatch,
    ],
  );

  const handleMatchingComplete = useCallback(() => {
    if (waitingForNextBatch) {
      return;
    }
    setIsCorrect(true);
    if (user) {
      bufferQuizAnswer(user.uid, true);
    }
    setSelectedOption(null);
    setIsCorrect(null);
    loadNextQuiz();
  }, [bufferQuizAnswer, loadNextQuiz, user, waitingForNextBatch]);

  const handlePairMatched = useCallback(() => {
    setMatchCount((c) => c + 1);
  }, []);

  const handleMatchingWrong = useCallback(() => {
    if (waitingForNextBatch) {
      return;
    }
    if (user) {
      bufferQuizAnswer(user.uid, false);
    }
    const newWrongCount = wrongCount + 1;
    setWrongCount(newWrongCount);
    if (newWrongCount >= 3) {
      setIsStopped(true);
    }
  }, [bufferQuizAnswer, user, waitingForNextBatch, wrongCount]);

  const handleTimeUp = useCallback(() => {
    if (isCorrect === true || !quizItem || isStopped || waitingForNextBatch) {
      return;
    }

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
    waitingForNextBatch,
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
      const loadingStartedAt = Date.now();
      setLoading(true);
      setCurrentBatch([]);
      setNextBatch([]);
      setCurrentIndex(0);
      setTurnNumber(1);
      setQuizItem(null);
      setOptions([]);
      setWordOptions([]);
      setMatchingPairs([]);
      setSelectedOption(null);
      setIsCorrect(null);
      setWrongCount(0);
      setIsStopped(false);
      setWaitingForNextBatch(false);
      setRolloverLoadingVisible(false);
      rolloverLoadingStartedAtRef.current = null;
      clearRolloverDelayTimer();
      quizTypeIndexRef.current = 0;

      const batch = await fetchBatch();
      if (batchLoadVersionRef.current !== loadVersion) {
        return;
      }
      const resolvedBatch = resolveBatch(batch);

      if (resolvedBatch.length > 0) {
        setCurrentBatch(resolvedBatch);
        setCurrentIndex(0);
        setTurnNumber(1);
        generateQuiz(resolvedBatch[0], resolvedBatch);
      }

      const remainingDelay = Math.max(
        0,
        INITIAL_LOADING_MIN_MS - (Date.now() - loadingStartedAt),
      );
      if (remainingDelay > 0) {
        await sleep(remainingDelay);
      }
      if (batchLoadVersionRef.current !== loadVersion) {
        return;
      }
      setLoading(false);
    };
    void init();
  }, [clearRolloverDelayTimer, fetchBatch, generateQuiz, learningLanguage, resolveBatch]);

  useEffect(() => {
    if (!waitingForNextBatch || nextBatch.length === 0) {
      return;
    }

    let cancelled = false;

    const finishRollover = async () => {
      clearRolloverDelayTimer();
      const startedAt = rolloverLoadingStartedAtRef.current;
      if (rolloverLoadingVisible && startedAt) {
        const remainingDelay = Math.max(
          0,
          ROLLOVER_LOADING_MIN_MS - (Date.now() - startedAt),
        );
        if (remainingDelay > 0) {
          await sleep(remainingDelay);
        }
      }

      if (!cancelled) {
        applyNextBatch(nextBatch);
      }
    };

    void finishRollover();

    return () => {
      cancelled = true;
    };
  }, [
    applyNextBatch,
    clearRolloverDelayTimer,
    nextBatch,
    rolloverLoadingVisible,
    waitingForNextBatch,
  ]);

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
      const resolvedBatch = resolveBatch(batch);
      if (resolvedBatch.length > 0) {
          setNextBatch(resolvedBatch);
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
    resolveBatch,
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

  useEffect(() => {
    return () => {
      clearRolloverDelayTimer();
    };
  }, [clearRolloverDelayTimer]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loading || !quizItem || rolloverLoadingVisible) {
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
          <QuizGenerationAnimation isDark={isDark} mode="card" />
        </View>
      </View>
    );
  }

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
            isCorrect === null &&
            !loading &&
            !isStopped &&
            !waitingForNextBatch
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
                onPairMatched={handlePairMatched}
                matchingMode="meaning"
                instruction={t("dashboard.popQuiz.matchingHint")}
              />
            )}
            {quizType === "synonym-matching" && (
              <MatchingQuiz
                pairs={matchingPairs}
                isDark={isDark}
                onComplete={handleMatchingComplete}
                onWrong={handleMatchingWrong}
                onPairMatched={handlePairMatched}
                matchingMode="synonym"
                instruction={t("dashboard.popQuiz.synonymMatchingHint")}
              />
            )}
            {quizType === "fill-in-blank" && quizItem.example !== undefined && (
              <FillInBlankQuiz
                clozeSentence={quizItem.example}
                options={wordOptions}
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
