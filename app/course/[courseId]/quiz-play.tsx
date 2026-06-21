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
import { EyeComfortHeaderButton } from "../../../src/components/common/EyeComfortHeaderButton";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { sanitizeRequestedQuizType } from "../../../src/course/quizModes";
import {
  hasReachedQuizCompletionThreshold,
  type QuizQuestion,
} from "../../../src/course/quizUtils";
import { useAndroidImmersiveStudyMode } from "../../../src/hooks/useAndroidImmersiveStudyMode";
import { useJapaneseContentLanguage } from "../../../src/hooks/useJapaneseContentLanguage";
import { fetchCourseQuizData } from "../../../src/services/courseQuizDataService";
import { db } from "../../../src/services/firebase";
import { useUserStatsStore } from "../../../src/stores";
import { useReadingDisplayStore } from "../../../src/stores/readingDisplayStore";
import {
  CourseType,
  findRuntimeCourse,
  isJlptLevelCourseId,
} from "../../../src/types/vocabulary";

const INITIAL_LOADING_MIN_MS = 500;
const MAX_INCORRECT_ANSWERS = 3;
const ANSWER_FEEDBACK_MS = 1500;
const MATCHING_TIMER_SECONDS = 15;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export default function QuizPlayScreen() {
  useAndroidImmersiveStudyMode("QuizPlayScreen");

  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
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
  const contentLanguage = useJapaneseContentLanguage(courseId, i18n.language);
  const isReadingDisplayModalOpen = useReadingDisplayStore(
    (state) => state.isDisplayModalOpen,
  );
  const dayNumber = parseInt(day || "1", 10);
  const showJlptPronunciationDetails = isJlptLevelCourseId(courseId);

  const [loading, setLoading] = useState(false);
  const [noQuizData, setNoQuizData] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState(0);
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
  const retakeMarkedRef = React.useRef(false);
  const incorrectCountRef = React.useRef(0);
  const matchingWrongTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isFocusedRef = React.useRef(true);

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
      clearMatchingWrongTimeout();
    },
    [clearMatchingWrongTimeout],
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
      setLoading(true);
      clearMatchingWrongTimeout();
      setNoQuizData(false);
      setQuestions([]);
      setMatchingMeanings([]);
      setScore(0);
      resetIncorrectCount();
      setQuizFinished(false);
      setSelectedWord(null);
      setSelectedMeaning(null);
      setWrongWord(null);
      setWrongMeaning(null);
      setMatchedPairs({});
      setMatchingTimerResetKey(0);
      setIsQuitPromptOpen(false);
      try {
        const savedQuiz = await fetchCourseQuizData(
          courseId as CourseType,
          dayNumber,
          requestedQuizType,
          contentLanguage,
        );

        if (cancelled) {
          return;
        }

        if (!savedQuiz || savedQuiz.questions.length === 0) {
          setNoQuizData(true);
          return;
        }

        setQuestions(savedQuiz.questions);
        setMatchingMeanings(savedQuiz.matchingChoices);
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
    contentLanguage,
    quizType,
    requestedQuizType,
    resetIncorrectCount,
    clearMatchingWrongTimeout,
  ]);

  const currentQuestion = questions[0];
  const matchedCount = Object.keys(matchedPairs).length;
  const totalQuestions = questions.length;

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
      await setDoc(
        doc(db, "quiz", user.uid, "course", `${courseId}-day${day}`),
        {
          courseId,
          day: dayNumber,
          quizType: "matching",
          score: resolvedScore,
          totalQuestions,
          percentage,
          completedAt: new Date().toISOString(),
        },
      );

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

      await flushQuizStats(user.uid);
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const finishQuiz = (finalScore: number) => {
    clearMatchingWrongTimeout();
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

  const handleMatchingAttempt = async (word: string, meaning: string) => {
    const correctQuestion = questions.find((q) => q.word === word);
    const correct =
      (correctQuestion?.matchChoiceText ?? correctQuestion?.meaning) === meaning;

    if (user) {
      bufferQuizAnswer(user.uid, correct);
    }

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

    const nextScore = score + 1;
    setMatchedPairs((prev) => ({ ...prev, [word]: meaning }));
    setMatchingTimerResetKey((prev) => prev + 1);
    setScore((prev) => prev + 1);
    await maybeMarkRetake(nextScore);

    setSelectedWord(null);
    setSelectedMeaning(null);

    if (Object.keys(matchedPairs).length + 1 === totalQuestions) {
      finishQuiz(nextScore);
    }
  };

  const handleSelectWord = (word: string) => {
    if (wrongWord || wrongMeaning) return;
    if (matchedPairs[word]) return;
    if (selectedMeaning) {
      void handleMatchingAttempt(word, selectedMeaning);
      return;
    }
    setSelectedWord(word);
  };

  const handleSelectMeaning = (meaning: string) => {
    if (wrongWord || wrongMeaning) return;
    if (Object.values(matchedPairs).includes(meaning)) return;
    if (selectedWord) {
      void handleMatchingAttempt(selectedWord, meaning);
      return;
    }
    setSelectedMeaning(meaning);
  };

  const handleMatchingPageAdvance = React.useCallback(() => {
    setMatchingTimerResetKey((prev) => prev + 1);
  }, []);

  const handleTimeUp = () => {
    finishQuiz(score);
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
    clearMatchingWrongTimeout();
    setScore(0);
    resetIncorrectCount();
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
          { backgroundColor: bgColors.screen },
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
          { backgroundColor: bgColors.screen },
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
          { backgroundColor: bgColors.screen },
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
      style={[styles.container, { backgroundColor: bgColors.screen }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <QuizHeader
        title=""
        isDark={isDark}
        onQuit={handleQuit}
        rightAction={<EyeComfortHeaderButton />}
      />
      <QuizTimer
        duration={MATCHING_TIMER_SECONDS}
        onTimeUp={handleTimeUp}
        isRunning={
          !quizFinished &&
          !isQuitPromptOpen &&
          !isReadingDisplayModalOpen &&
          !wrongWord &&
          !wrongMeaning &&
          incorrectCount < MAX_INCORRECT_ANSWERS
        }
        quizKey={`matching-${matchingTimerResetKey}`}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.matchingContent}>
          <GameBoard
            quizType="matching"
            courseId={courseId}
            currentQuestion={currentQuestion}
            questions={questions}
            progressCurrent={matchedCount}
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
            onMatchingPageAdvance={handleMatchingPageAdvance}
            showPronunciationDetails={showJlptPronunciationDetails}
          />
        </View>
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
  matchingContent: {
    flex: 1,
    padding: 20,
  },
});
