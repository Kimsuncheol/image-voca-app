/**
 * ====================================
 * DASHBOARD POP QUIZ COMPONENT (REFACTORED)
 * ====================================
 *
 * Orchestrator component for the pop quiz feature on the dashboard.
 * Features:
 * - Fetches random vocabulary words from various courses
 * - Supports multiple quiz types (multiple-choice, fill-in-blank, matching, word-arrangement)
 * - Manages batching and prefetching for infinite play
 * - Tracks user answers and updates statistics
 *
 * This component has been modularized into smaller focused pieces:
 * - hooks/useQuizBatchFetcher.ts: Data fetching and caching logic
 * - utils/quizHelpers.ts: Helper functions
 * - constants/quizConfig.ts: Configuration constants
 * - quiz-types/*.tsx: Individual quiz type renderers
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
import { FillInBlankQuiz } from "./quiz-types/FillInBlankQuiz";
import { MatchingQuiz } from "./quiz-types/MatchingQuiz";
import { MultipleChoiceQuiz } from "./quiz-types/MultipleChoiceQuiz";
import { WordArrangementQuiz } from "./quiz-types/WordArrangementQuiz";
import { QuizHeader } from "./QuizHeader";
import { QuizStoppedState } from "./QuizStoppedState";
import {
  createClozeSentence,
  tokenizeSentence,
  extractRandomExampleLine,
} from "./utils/quizHelpers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface QuizItem {
  word: string;
  meaning: string;
  clozeSentence?: string;
  translation?: string;
  example?: string;
}

interface MatchingOption {
  id: string;
  label: string;
}

interface MatchingQuizData {
  words: MatchingOption[];
  meanings: MatchingOption[];
  wordMeaningMap: Record<string, string>;
  wordLabels: string[];
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
  const { quizType, isLoaded, loadQuizType } = usePopQuizPreferencesStore();

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

  // Matching quiz state
  const [matchingWords, setMatchingWords] = useState<MatchingOption[]>([]);
  const [matchingMeanings, setMatchingMeanings] = useState<MatchingOption[]>(
    [],
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  // Word arrangement state
  const [shuffledChunks, setShuffledChunks] = useState<string[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);
  const [prefilledSpeaker, setPrefilledSpeaker] = useState<string | null>(null);

  // Matching quiz mapping (for validating all 4 pairs)
  const [wordMeaningMap, setWordMeaningMap] = useState<Record<string, string>>(
    {},
  );

  // Wrong answer tracking
  const [wrongCount, setWrongCount] = useState(0);
  const [isStopped, setIsStopped] = useState(false);

  // ==========================================================================
  // REFS
  // ==========================================================================
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasLoggedTotalDays = useRef(false);
  const prevMatchingWordsRef = useRef<string[]>([]);
  const prefetchedMatchingRef = useRef<{
    quizItem: QuizItem;
    words: MatchingOption[];
    meanings: MatchingOption[];
    wordMeaningMap: Record<string, string>;
    wordLabels: string[];
  } | null>(null);

  // Derived state
  const quizKey = `${turnNumber}-${currentIndex}`;

  const buildMatchingQuizData = useCallback(
    (wordsToMatch: any[]): MatchingQuizData => {
      const words = wordsToMatch.map((wordObj, index) => ({
        id: `word-${index}`,
        label: wordObj.word,
      }));

      const meanings = wordsToMatch.map((wordObj, index) => ({
        id: `meaning-${index}`,
        label: wordObj.meaning,
      }));
      const shuffledMeanings = [...meanings].sort(() => Math.random() - 0.5);

      const mapping: Record<string, string> = {};
      words.forEach((wordOption, index) => {
        mapping[wordOption.id] = meanings[index].id;
      });

      return {
        words,
        meanings: shuffledMeanings,
        wordMeaningMap: mapping,
        wordLabels: words.map((wordOption) => wordOption.label),
      };
    },
    [],
  );

  // ==========================================================================
  // QUIZ GENERATION
  // ==========================================================================
  /**
   * Generates a single quiz item from the current batch.
   * Creates distractors from other words in the same batch.
   * Supports multiple quiz types: multiple-choice, fill-in-blank, matching, word-arrangement
   */
  const generateQuiz = useCallback(
    (wordData: any, batch: any[]) => {
      if (batch.length < 4) return;

      const targetWord = wordData;
      const availableWords = batch.filter((w) => w.word !== targetWord.word);

      if (quizType === "multiple-choice") {
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
        setMatchingWords([]);
        setMatchingMeanings([]);
        setShuffledChunks([]);
        setSelectedChunks([]);
        setPrefilledSpeaker(null);
        setWordMeaningMap({});
      } else if (quizType === "fill-in-blank") {
        // Fill in blank: Show cloze sentence, pick word from 4 options
        const example = targetWord.example || `The word is ${targetWord.word}.`;
        const clozeSentence = createClozeSentence(example, targetWord.word);

        const distractors: string[] = [];
        const shuffledAvailable = [...availableWords].sort(
          () => Math.random() - 0.5,
        );

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
        setPrefilledSpeaker(null);
        setWordMeaningMap({});
      } else if (quizType === "matching") {
        // Matching: Show 4 words and 4 meanings, user matches them
        // Prefer companions not used in the previous matching set
        const prevWords = new Set(prevMatchingWordsRef.current);
        const freshAvailable = availableWords.filter(
          (w) => !prevWords.has(w.word),
        );
        const shuffledFresh = [...freshAvailable].sort(
          () => Math.random() - 0.5,
        );

        let companions: any[];
        if (shuffledFresh.length >= 3) {
          companions = shuffledFresh.slice(0, 3);
        } else {
          const usedAvailable = availableWords.filter((w) =>
            prevWords.has(w.word),
          );
          const shuffledUsed = [...usedAvailable].sort(
            () => Math.random() - 0.5,
          );
          companions = [...shuffledFresh, ...shuffledUsed].slice(0, 3);
        }

        const wordsToMatch = [targetWord, ...companions];
        const matchingData = buildMatchingQuizData(wordsToMatch);

        // Track current matching words for next quiz
        prevMatchingWordsRef.current = matchingData.wordLabels;

        setQuizItem({ word: targetWord.word, meaning: targetWord.meaning });
        setMatchingWords(matchingData.words);
        setMatchingMeanings(matchingData.meanings);
        setWordMeaningMap(matchingData.wordMeaningMap);
        setOptions([]);
        setMatchedPairs({});
        setSelectedWord(null);
        setSelectedMeaning(null);
        setShuffledChunks([]);
        setSelectedChunks([]);
        setPrefilledSpeaker(null);
      } else if (quizType === "word-arrangement") {
        // Word arrangement: Show shuffled chunks, user arranges them
        const example = targetWord.example || targetWord.word;

        // Extract a random line from multi-line example + matching translation
        const dialogueLine = extractRandomExampleLine(
          example,
          targetWord.translation,
        );

        // Tokenize only the text part (exclude speaker/prefix if present)
        const textToArrange = dialogueLine.text;
        const chunks = tokenizeSentence(textToArrange);
        const shuffled = [...chunks].sort(() => Math.random() - 0.5);

        setQuizItem({
          word: targetWord.word,
          meaning: targetWord.meaning,
          example: dialogueLine.fullLine, // Store full line for validation
          translation: dialogueLine.matchedTranslation || undefined, // Use matched line, not full text
        });
        setShuffledChunks(shuffled);

        // Pre-fill speaker if present
        const speaker = dialogueLine.speaker;
        setPrefilledSpeaker(speaker);
        setSelectedChunks(speaker ? [speaker] : []);

        setOptions([]);
        setMatchingWords([]);
        setMatchingMeanings([]);
        setWordMeaningMap({});
      }
    },
    [quizType, buildMatchingQuizData],
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
        prefetchedMatchingRef.current = null;
        prevMatchingWordsRef.current = [];
        generateQuiz(nextBatch[0], nextBatch);
      } else {
        setLoading(true);
      }
      return;
    }

    setCurrentIndex(newIndex);

    // Use prefetched matching data if available
    if (prefetchedMatchingRef.current) {
      const data = prefetchedMatchingRef.current;
      prefetchedMatchingRef.current = null;
      prevMatchingWordsRef.current = data.wordLabels;
      setQuizItem(data.quizItem);
      setMatchingWords(data.words);
      setMatchingMeanings(data.meanings);
      setWordMeaningMap(data.wordMeaningMap);
      setOptions([]);
      setMatchedPairs({});
      setSelectedWord(null);
      setSelectedMeaning(null);
      setShuffledChunks([]);
      setSelectedChunks([]);
      setPrefilledSpeaker(null);
      setWrongCount(0);
      return;
    }

    generateQuiz(currentBatch[newIndex], currentBatch);
  }, [currentBatch, currentIndex, nextBatch, turnNumber, generateQuiz]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
  const handleOptionPress = useCallback(
    (option: string) => {
      if (isCorrect === true || !quizItem || isStopped) return;

      let isAnswerCorrect = false;
      if (quizType === "multiple-choice") {
        isAnswerCorrect = option === quizItem.meaning;
      } else if (quizType === "fill-in-blank") {
        isAnswerCorrect = option.toLowerCase() === quizItem.word.toLowerCase();
      }

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
      quizType,
    ],
  );

  const handleSelectWord = useCallback(
    (wordId: string) => {
      if (matchedPairs[wordId] || isStopped) return;
      if (selectedMeaning) {
        const correctMeaningId = wordMeaningMap[wordId];

        if (!correctMeaningId) {
          console.warn(`[MatchingQuiz] No mapping found for word ID: ${wordId}`);
          setSelectedWord(null);
          setSelectedMeaning(null);
          return;
        }

        const isCorrectMatch = correctMeaningId === selectedMeaning;

        if (user) {
          bufferQuizAnswer(user.uid, isCorrectMatch);
        }

        if (isCorrectMatch) {
          setMatchedPairs((prev) => ({ ...prev, [wordId]: selectedMeaning }));
          setSelectedWord(null);
          setSelectedMeaning(null);

          if (Object.keys(matchedPairs).length + 1 >= 4) {
            setTimeout(() => {
              setMatchedPairs({});
              loadNextQuiz();
            }, 500);
          }
        } else {
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
      setSelectedWord(wordId);
    },
    [
      matchedPairs,
      selectedMeaning,
      wordMeaningMap,
      user,
      bufferQuizAnswer,
      wrongCount,
      isStopped,
      loadNextQuiz,
    ],
  );

  const handleSelectMeaning = useCallback(
    (meaningId: string) => {
      if (Object.values(matchedPairs).includes(meaningId) || isStopped) return;
      if (selectedWord) {
        const correctMeaningId = wordMeaningMap[selectedWord];

        if (!correctMeaningId) {
          console.warn(
            `[MatchingQuiz] No mapping found for word ID: ${selectedWord}`,
          );
          setSelectedWord(null);
          setSelectedMeaning(null);
          return;
        }

        const isCorrectMatch = meaningId === correctMeaningId;

        if (user) {
          bufferQuizAnswer(user.uid, isCorrectMatch);
        }

        if (isCorrectMatch) {
          setMatchedPairs((prev) => ({ ...prev, [selectedWord]: meaningId }));
          setSelectedWord(null);
          setSelectedMeaning(null);

          if (Object.keys(matchedPairs).length + 1 >= 4) {
            setTimeout(() => {
              setMatchedPairs({});
              loadNextQuiz();
            }, 500);
          }
        } else {
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
      setSelectedMeaning(meaningId);
    },
    [
      matchedPairs,
      selectedWord,
      wordMeaningMap,
      user,
      bufferQuizAnswer,
      wrongCount,
      isStopped,
      loadNextQuiz,
    ],
  );

  const handleChunkSelect = useCallback(
    (chunk: string, index: number) => {
      if (isStopped) return;
      const newShuffled = [...shuffledChunks];
      newShuffled.splice(index, 1);
      setShuffledChunks(newShuffled);
      setSelectedChunks((prev) => [...prev, chunk]);

      if (newShuffled.length === 0) {
        const userSentence = [...selectedChunks, chunk].join(" ");
        const correctSentence = quizItem?.example || "";

        // Normalize both sentences for comparison (trim, normalize spaces)
        const normalizeText = (text: string) =>
          text.trim().replace(/\s+/g, " ");
        const isCorrectArrangement =
          normalizeText(userSentence) === normalizeText(correctSentence);

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
            setTimeout(() => {
              const example = quizItem?.example || "";
              const dialogueLine = extractRandomExampleLine(example);
              const chunks = tokenizeSentence(dialogueLine.text);
              setShuffledChunks([...chunks].sort(() => Math.random() - 0.5));
              setSelectedChunks(
                dialogueLine.speaker ? [dialogueLine.speaker] : [],
              );
            }, 1000);
          }
        }
      }
    },
    [
      shuffledChunks,
      selectedChunks,
      quizItem,
      user,
      bufferQuizAnswer,
      wrongCount,
      isStopped,
      loadNextQuiz,
    ],
  );

  const handleChunkDeselect = useCallback(
    (index: number) => {
      if (isStopped) return;

      const chunk = selectedChunks[index];
      if (!chunk) return;

      // Prevent deselecting pre-filled speaker
      if (prefilledSpeaker && chunk === prefilledSpeaker) {
        return;
      }

      const newSelected = [...selectedChunks];
      newSelected.splice(index, 1);
      setSelectedChunks(newSelected);
      setShuffledChunks((prev) => [...prev, chunk]);
    },
    [selectedChunks, isStopped, prefilledSpeaker],
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

  // Prefetch next matching quiz data while user works on current set
  useEffect(() => {
    if (quizType !== "matching") {
      prefetchedMatchingRef.current = null;
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= currentBatch.length) {
      prefetchedMatchingRef.current = null;
      return;
    }

    const nextTarget = currentBatch[nextIndex];
    const available = currentBatch.filter(
      (w) => w.word !== nextTarget.word,
    );

    // Prefer companions not used in the current matching set
    const prevWords = new Set(prevMatchingWordsRef.current);
    const freshAvailable = available.filter((w) => !prevWords.has(w.word));
    const shuffledFresh = [...freshAvailable].sort(
      () => Math.random() - 0.5,
    );

    let companions: any[];
    if (shuffledFresh.length >= 3) {
      companions = shuffledFresh.slice(0, 3);
    } else {
      const usedAvailable = available.filter((w) => prevWords.has(w.word));
      const shuffledUsed = [...usedAvailable].sort(
        () => Math.random() - 0.5,
      );
      companions = [...shuffledFresh, ...shuffledUsed].slice(0, 3);
    }

    const wordsToMatch = [nextTarget, ...companions];
    const matchingData = buildMatchingQuizData(wordsToMatch);

    prefetchedMatchingRef.current = {
      quizItem: { word: nextTarget.word, meaning: nextTarget.meaning },
      words: matchingData.words,
      meanings: matchingData.meanings,
      wordMeaningMap: matchingData.wordMeaningMap,
      wordLabels: matchingData.wordLabels,
    };
  }, [currentIndex, currentBatch, quizType, buildMatchingQuizData]);

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

            {quizType === "fill-in-blank" && (
              <FillInBlankQuiz
                quizItem={quizItem}
                options={options}
                selectedOption={selectedOption}
                isCorrect={isCorrect}
                isDark={isDark}
                onOptionPress={handleOptionPress}
              />
            )}

            {quizType === "matching" && (
              <MatchingQuiz
                matchingWords={matchingWords}
                matchingMeanings={matchingMeanings}
                selectedWord={selectedWord}
                selectedMeaning={selectedMeaning}
                matchedPairs={matchedPairs}
                isDark={isDark}
                onSelectWord={handleSelectWord}
                onSelectMeaning={handleSelectMeaning}
              />
            )}

            {quizType === "word-arrangement" && (
              <WordArrangementQuiz
                quizItem={quizItem}
                shuffledChunks={shuffledChunks}
                selectedChunks={selectedChunks}
                prefilledSpeaker={prefilledSpeaker}
                isDark={isDark}
                onChunkSelect={handleChunkSelect}
                onChunkDeselect={handleChunkDeselect}
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
