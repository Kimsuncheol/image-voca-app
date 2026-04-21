import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSplashScreen } from "../../../components/common/AppSplashScreen";
import {
  EmptyQuizScreen,
  GameBoard,
  QuizFinishView,
  QuizHeader,
  QuizTimer,
} from "../../../components/course";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  type QuizTypeId,
  resolveRuntimeQuizType,
  sanitizeRequestedQuizType,
} from "../../../src/course/quizModes";
import {
  generateQuizQuestions,
  hasReachedQuizCompletionThreshold,
  mapKanjiWordToQuizData,
  type QuizQuestion,
  type QuizVocabData,
} from "../../../src/course/quizUtils";
import {
  fetchCourseQuizData,
  isFirestoreBackedQuizType,
} from "../../../src/services/courseQuizDataService";
import { db } from "../../../src/services/firebase";
import { prefetchVocabularyCards } from "../../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../../src/stores";
import {
  CourseType,
  findRuntimeCourse,
  isJlptLevelCourseId,
  isKanjiWord,
} from "../../../src/types/vocabulary";
import { resolveQuizVocabulary } from "../../../src/utils/localizedVocabulary";
import { isPronunciationMatchEligible } from "../../../src/utils/pronunciationMatching";
import { normalizeSynonyms } from "../../../src/utils/synonyms";

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const INITIAL_LOADING_MIN_MS = 500;
const MAX_INCORRECT_ANSWERS = 3;
const ANSWER_FEEDBACK_MS = 1500;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export default function QuizPlayScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const {
    bufferQuizAnswer,
    flushQuizStats,
    courseProgress,
    fetchCourseProgress,
    updateCourseDayProgress,
  } = useUserStatsStore();
  const { courseId, day, quizType } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    quizType: string;
  }>();
  const requestedQuizType = sanitizeRequestedQuizType(courseId, quizType);
  const course = findRuntimeCourse(courseId);
  const dayNumber = parseInt(day || "1", 10);
  const showJlptPronunciationDetails = isJlptLevelCourseId(courseId);

  const [loading, setLoading] = useState(false);
  const [noQuizData, setNoQuizData] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [wrongWord, setWrongWord] = useState<string | null>(null);
  const [wrongMeaning, setWrongMeaning] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [matchingMeanings, setMatchingMeanings] = useState<string[]>([]);
  const [matchingTimerResetKey, setMatchingTimerResetKey] = useState(0);
  const [isQuitPromptOpen, setIsQuitPromptOpen] = useState(false);
  const [effectiveQuizType, setEffectiveQuizType] =
    useState<QuizTypeId>(requestedQuizType);
  const retakeMarkedRef = React.useRef(false);
  const incorrectCountRef = React.useRef(0);
  const answerAdvanceTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const matchingWrongTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isFocusedRef = React.useRef(true);
  const resolvedQuizType = resolveRuntimeQuizType(effectiveQuizType);

  const clearAnswerAdvanceTimeout = React.useCallback(() => {
    if (answerAdvanceTimeoutRef.current) {
      clearTimeout(answerAdvanceTimeoutRef.current);
      answerAdvanceTimeoutRef.current = null;
    }
  }, []);

  const clearMatchingWrongTimeout = React.useCallback(() => {
    if (matchingWrongTimeoutRef.current) {
      clearTimeout(matchingWrongTimeoutRef.current);
      matchingWrongTimeoutRef.current = null;
    }
  }, []);

  const resetIncorrectCount = React.useCallback(() => {
    incorrectCountRef.current = 0;
    setIncorrectCount(0);
  }, []);

  React.useEffect(
    () => () => {
      clearAnswerAdvanceTimeout();
      clearMatchingWrongTimeout();
    },
    [clearAnswerAdvanceTimeout, clearMatchingWrongTimeout],
  );

  useEffect(() => {
    if (user && courseId) {
      fetchCourseProgress(user.uid, courseId);
    }
  }, [user, courseId, fetchCourseProgress]);

  useEffect(() => {
    if (!courseId) {
      retakeMarkedRef.current = false;
      return;
    }
    retakeMarkedRef.current =
      courseProgress[courseId]?.[dayNumber]?.isRetake || false;
  }, [courseProgress, courseId, dayNumber]);

  useEffect(() => {
    let cancelled = false;

    const fetchVocabulary = async () => {
      const loadingStartedAt = Date.now();
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("[QuizPlay] route params", {
          courseId,
          day,
          quizType,
          requestedQuizType,
          language: i18n.language,
        });
      }
      setLoading(true);
      clearMatchingWrongTimeout();
      setNoQuizData(false);
      setQuestions([]);
      setMatchingMeanings([]);
      setCurrentIndex(0);
      setScore(0);
      resetIncorrectCount();
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(false);
      setQuizFinished(false);
      setSelectedWord(null);
      setSelectedMeaning(null);
      setWrongWord(null);
      setWrongMeaning(null);
      setMatchedPairs({});
      setMatchingTimerResetKey(0);
      setIsQuitPromptOpen(false);
      try {
        if (isFirestoreBackedQuizType(requestedQuizType)) {
          const savedQuiz = await fetchCourseQuizData(
            courseId as CourseType,
            dayNumber,
            requestedQuizType,
            i18n.language,
          );

          if (cancelled) {
            return;
          }

          setEffectiveQuizType(requestedQuizType);
          if (!savedQuiz || savedQuiz.questions.length === 0) {
            setNoQuizData(true);
            return;
          }

          setQuestions(savedQuiz.questions);
          setMatchingMeanings(savedQuiz.matchingChoices);
          return;
        }

        const fetchedCards = await prefetchVocabularyCards(
          courseId as CourseType,
          dayNumber,
        );
        const fetchedVocab: QuizVocabData[] = fetchedCards.map((card) => {
          if (isKanjiWord(card)) {
            return mapKanjiWordToQuizData(card);
          }

          const resolved = resolveQuizVocabulary(card, i18n.language);
          return {
            word: resolved.word,
            meaning: resolved.meaning,
            synonyms: normalizeSynonyms(card.synonyms),
            pronunciation: resolved.pronunciation,

            localizedPronunciation: resolved.localizedPronunciation,
            example: resolved.example,
            translation: resolved.translation,
          };
        });

        console.log(
          `Fetched ${fetchedVocab.length} words from Day${dayNumber} for quiz`,
        );

        if (fetchedVocab.length < 4) {
          console.warn("Not enough vocabulary for quiz (need at least 4)");
        }

        const synonymEligibleCount = fetchedVocab.filter(
          (vocab) => (vocab.synonyms?.length ?? 0) > 0,
        ).length;
        const pronunciationEligibleCount = fetchedVocab.filter((vocab) =>
          isPronunciationMatchEligible(vocab.word, vocab.pronunciation),
        ).length;
        const nextQuizType =
          requestedQuizType === "synonym-matching" && synonymEligibleCount < 4
            ? "matching"
            : requestedQuizType === "pronunciation-matching" &&
                pronunciationEligibleCount < 4
              ? "matching"
              : requestedQuizType;
        const nextResolvedQuizType = resolveRuntimeQuizType(nextQuizType);
        setEffectiveQuizType(nextQuizType);

        const generatedQuestions = generateQuizQuestions(
          fetchedVocab,
          nextResolvedQuizType,
        );
        if (cancelled) {
          return;
        }
        setQuestions(generatedQuestions);
        setNoQuizData(generatedQuestions.length === 0);

        if (
          nextResolvedQuizType === "matching" ||
          nextResolvedQuizType === "synonym-matching" ||
          nextResolvedQuizType === "pronunciation-matching"
        ) {
          setMatchingMeanings(
            shuffleArray(
              generatedQuestions.map((q) =>
                nextResolvedQuizType === "synonym-matching" && q.synonym
                  ? q.synonym
                  : nextResolvedQuizType === "pronunciation-matching" &&
                      q.pronunciation
                    ? q.pronunciation
                    : q.meaning,
              ),
            ),
          );
        } else {
          setMatchingMeanings([]);
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        if (!cancelled) {
          setNoQuizData(true);
        }
      } finally {
        const remainingDelay = Math.max(
          0,
          INITIAL_LOADING_MIN_MS - (Date.now() - loadingStartedAt),
        );
        if (remainingDelay > 0) {
          await sleep(remainingDelay);
        }
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchVocabulary();
    return () => {
      cancelled = true;
    };
  }, [
    courseId,
    day,
    dayNumber,
    i18n.language,
    quizType,
    requestedQuizType,
    resetIncorrectCount,
    clearMatchingWrongTimeout,
  ]);

  const currentQuestion = questions[currentIndex];
  const isMatching =
    resolvedQuizType === "matching" ||
    resolvedQuizType === "synonym-matching" ||
    resolvedQuizType === "pronunciation-matching";
  const matchedCount = Object.keys(matchedPairs).length;
  const totalQuestions = questions.length;
  const progressCurrent = isMatching ? matchedCount : currentIndex + 1;

  const maybeMarkRetake = React.useCallback(
    async (nextScore: number) => {
      if (!user || !courseId) return;
      if (retakeMarkedRef.current) return;

      const existingAccumulated =
        courseProgress[courseId]?.[dayNumber]?.accumulatedCorrect || 0;
      const totalCorrect = existingAccumulated + nextScore;

      if (!hasReachedQuizCompletionThreshold(totalCorrect, totalQuestions)) {
        return;
      }

      retakeMarkedRef.current = true;
      updateCourseDayProgress(courseId, dayNumber, { isRetake: true });

      try {
        await updateDoc(doc(db, "users", user.uid), {
          [`courseProgress.${courseId}.${dayNumber}.isRetake`]: true,
        });
      } catch (error) {
        console.error("Error marking day as retake:", error);
      }
    },
    [
      user,
      courseId,
      courseProgress,
      dayNumber,
      totalQuestions,
      updateCourseDayProgress,
    ],
  );

  const saveQuizResult = async (finalScore?: number) => {
    if (!user || !courseId) return;

    const resolvedScore = finalScore ?? score;
    const percentage =
      totalQuestions > 0
        ? Math.round((resolvedScore / totalQuestions) * 100)
        : 0;

    try {
      // Save quiz result to Firestore
      await setDoc(
        doc(db, "quiz", user.uid, "course", `${courseId}-day${day}`),
        {
          courseId,
          day: dayNumber,
          quizType: effectiveQuizType,
          score: resolvedScore,
          totalQuestions,
          percentage,
          completedAt: new Date().toISOString(),
        },
      );

      // Update course progress
      let accumulatedCorrect = resolvedScore;
      const existingProgress = courseProgress[courseId]?.[dayNumber] || null;
      if (typeof existingProgress?.accumulatedCorrect === "number") {
        accumulatedCorrect += existingProgress.accumulatedCorrect;
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const storedProgress =
            data.courseProgress?.[courseId as string]?.[dayNumber] || {};
          accumulatedCorrect += storedProgress.accumulatedCorrect || 0;
        }
      }
      const didReachTarget = hasReachedQuizCompletionThreshold(
        accumulatedCorrect,
        totalQuestions,
      );

      await updateDoc(doc(db, "users", user.uid), {
        [`courseProgress.${courseId}.${dayNumber}.quizCompleted`]:
          didReachTarget,
        [`courseProgress.${courseId}.${dayNumber}.quizScore`]: percentage,
        [`courseProgress.${courseId}.${dayNumber}.accumulatedCorrect`]:
          accumulatedCorrect,
        [`courseProgress.${courseId}.${dayNumber}.isRetake`]: didReachTarget,
      });

      updateCourseDayProgress(courseId, dayNumber, {
        quizCompleted: didReachTarget,
        quizScore: percentage,
        accumulatedCorrect,
        isRetake: didReachTarget,
      });

      // Flush any buffered quiz stats
      await flushQuizStats(user.uid);
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const finishQuiz = (finalScore: number) => {
    clearAnswerAdvanceTimeout();
    clearMatchingWrongTimeout();
    setShowResult(false);
    setUserAnswer("");
    setSelectedWord(null);
    setSelectedMeaning(null);
    setWrongWord(null);
    setWrongMeaning(null);
    setIsQuitPromptOpen(false);
    setQuizFinished(true);
    saveQuizResult(finalScore);
  };

  const recordIncorrectAndMaybeFinish = () => {
    const nextIncorrectCount = incorrectCountRef.current + 1;
    incorrectCountRef.current = nextIncorrectCount;
    setIncorrectCount(nextIncorrectCount);

    return nextIncorrectCount >= MAX_INCORRECT_ANSWERS;
  };

  const handleAnswer = async (answer: string) => {
    const correct =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();
    const nextScore = correct ? score + 1 : score;
    console.log(
      `[Quiz] ${effectiveQuizType} answer in handleAnswer`,
      correct ? "correct" : "incorrect",
      {
        questionId: currentQuestion.id,
        word: currentQuestion.word,
        answer,
        correctAnswer: currentQuestion.correctAnswer,
      },
      `score: ${nextScore}`,
    );
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((prev) => prev + 1);
      await maybeMarkRetake(nextScore);
    }

    // Record answer for stats
    if (user) {
      bufferQuizAnswer(user.uid, correct);
    }

    const shouldFinishAfterFeedback =
      !correct && recordIncorrectAndMaybeFinish();

    // Auto-advance after showing feedback
    clearAnswerAdvanceTimeout();
    answerAdvanceTimeoutRef.current = setTimeout(() => {
      answerAdvanceTimeoutRef.current = null;
      if (!isFocusedRef.current) return;
      setShowResult(false);
      setUserAnswer("");

      if (shouldFinishAfterFeedback) {
        finishQuiz(nextScore);
      } else if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finishQuiz(nextScore);
      }
    }, ANSWER_FEEDBACK_MS);
  };

  const handleMatchingAttempt = async (word: string, meaning: string) => {
    const correctQuestion = questions.find((q) => q.word === word);
    const correct =
      (resolvedQuizType === "synonym-matching"
        ? correctQuestion?.synonym
        : resolvedQuizType === "pronunciation-matching"
          ? correctQuestion?.pronunciation
          : (correctQuestion?.matchChoiceText ?? correctQuestion?.meaning)) ===
      meaning;

    if (user) {
      bufferQuizAnswer(user.uid, correct);
    }

    console.log("[Quiz] matching attempt", correct ? "correct" : "incorrect", {
      word,
      meaning,
    });

    if (!correct) {
      const shouldFinishAfterFeedback = recordIncorrectAndMaybeFinish();
      setWrongWord(word);
      setWrongMeaning(meaning);
      clearMatchingWrongTimeout();
      matchingWrongTimeoutRef.current = setTimeout(() => {
        matchingWrongTimeoutRef.current = null;
        if (!isFocusedRef.current) return;
        setWrongWord(null);
        setWrongMeaning(null);
        setSelectedWord(null);
        setSelectedMeaning(null);
        if (shouldFinishAfterFeedback) {
          finishQuiz(score);
        }
      }, ANSWER_FEEDBACK_MS);
      return;
    }

    if (correct) {
      const nextScore = score + 1;
      setMatchedPairs((prev) => ({ ...prev, [word]: meaning }));
      setMatchingTimerResetKey((prev) => prev + 1);
      setScore((prev) => prev + 1);
      await maybeMarkRetake(nextScore);
    }

    setSelectedWord(null);
    setSelectedMeaning(null);

    if (correct && Object.keys(matchedPairs).length + 1 === totalQuestions) {
      finishQuiz(score + 1);
    }
  };

  const handleSelectWord = (word: string) => {
    if (wrongWord || wrongMeaning) return;
    if (matchedPairs[word]) return;
    if (selectedMeaning) {
      handleMatchingAttempt(word, selectedMeaning);
      return;
    }
    setSelectedWord(word);
  };

  const handleSelectMeaning = (meaning: string) => {
    if (wrongWord || wrongMeaning) return;
    if (Object.values(matchedPairs).includes(meaning)) return;
    if (selectedWord) {
      handleMatchingAttempt(selectedWord, meaning);
      return;
    }
    setSelectedMeaning(meaning);
  };

  const handleTimeUp = () => {
    if (isMatching) {
      // Matching game ends on time up
      finishQuiz(score);
      return;
    }

    // Treat as incorrect answer
    if (!showResult && !quizFinished) {
      handleAnswer(""); // Empty answer triggers incorrect
    }
  };

  const handleQuit = useCallback(() => {
    if (quizFinished) {
      router.back();
      return;
    }
    setIsQuitPromptOpen(true);
    Alert.alert(
      t("quiz.quit.title"),
      t("quiz.quit.message"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () => setIsQuitPromptOpen(false),
        },
        {
          text: t("quiz.quit.confirm"),
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
      {
        onDismiss: () => setIsQuitPromptOpen(false),
      },
    );
  }, [quizFinished, router, t]);

  // Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleQuit();
        return true;
      });
      return () => sub.remove();
    }, [handleQuit]),
  );

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
      };
    }, []),
  );

  const handleFinish = () => {
    router.dismiss(2);
  };

  const handleRetry = () => {
    clearAnswerAdvanceTimeout();
    clearMatchingWrongTimeout();
    setCurrentIndex(0);
    setScore(0);
    resetIncorrectCount();
    setUserAnswer("");
    setShowResult(false);
    setQuizFinished(false);
    setSelectedWord(null);
    setSelectedMeaning(null);
    setWrongWord(null);
    setWrongMeaning(null);
    setMatchedPairs({});
    setMatchingTimerResetKey(0);
    setIsQuitPromptOpen(false);
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
            headerShown: false,
          }}
        />
        <AppSplashScreen visible={true} onHidden={() => {}} />
      </SafeAreaView>
    );
  }

  if (noQuizData || totalQuestions === 0 || !currentQuestion) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
        edges={["left", "right", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyQuizScreen />
      </SafeAreaView>
    );
  }

  if (quizFinished) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <QuizFinishView
          score={score}
          totalQuestions={totalQuestions}
          isDark={isDark}
          onRetry={handleRetry}
          onFinish={handleFinish}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <QuizHeader title="" isDark={isDark} onQuit={handleQuit} />
      {!quizFinished && !loading && (
        <QuizTimer
          duration={15}
          onTimeUp={handleTimeUp}
          isRunning={
            !showResult &&
            !quizFinished &&
            !isQuitPromptOpen &&
            !wrongWord &&
            !wrongMeaning &&
            incorrectCount < MAX_INCORRECT_ANSWERS
          }
          quizKey={
            isMatching
              ? `matching-${matchingTimerResetKey}`
              : `${currentIndex}-${dayNumber}`
          }
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {isMatching ? (
          <View style={styles.matchingContent}>
            <GameBoard
              quizType={effectiveQuizType}
              courseId={courseId}
              currentQuestion={currentQuestion}
              questions={questions}
              progressCurrent={progressCurrent}
              courseColor={course?.color}
              isDark={isDark}
              matchingMeanings={matchingMeanings}
              selectedWord={selectedWord}
              selectedMeaning={selectedMeaning}
              wrongWord={wrongWord}
              wrongMeaning={wrongMeaning}
              matchedPairs={matchedPairs}
              onSelectWord={handleSelectWord}
              onSelectMeaning={handleSelectMeaning}
              userAnswer={userAnswer}
              showResult={showResult}
              isCorrect={isCorrect}
              showPronunciationDetails={showJlptPronunciationDetails}
              matchingMode={
                resolvedQuizType === "synonym-matching"
                  ? "synonym"
                  : resolvedQuizType === "pronunciation-matching"
                    ? "pronunciation"
                    : "meaning"
              }
              onAnswer={(answer) => {
                setUserAnswer(answer);
                handleAnswer(answer);
              }}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <GameBoard
              quizType={effectiveQuizType}
              courseId={courseId}
              currentQuestion={currentQuestion}
              questions={questions}
              progressCurrent={progressCurrent}
              courseColor={course?.color}
              isDark={isDark}
              matchingMeanings={matchingMeanings}
              selectedWord={selectedWord}
              selectedMeaning={selectedMeaning}
              wrongWord={wrongWord}
              wrongMeaning={wrongMeaning}
              matchedPairs={matchedPairs}
              onSelectWord={handleSelectWord}
              onSelectMeaning={handleSelectMeaning}
              userAnswer={userAnswer}
              showResult={showResult}
              isCorrect={isCorrect}
              showPronunciationDetails={showJlptPronunciationDetails}
              onAnswer={(answer) => {
                setUserAnswer(answer);
                handleAnswer(answer);
              }}
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  matchingContent: {
    flex: 1,
    padding: 20,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
