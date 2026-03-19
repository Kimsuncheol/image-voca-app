import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GameBoard,
  LoadingView,
  QuizFinishView,
  QuizTimer,
} from "../../../components/course";
import {
  resolveRuntimeQuizType,
  sanitizeRequestedQuizType,
} from "../../../src/course/quizModes";
import {
  generateQuizQuestions,
  hasReachedQuizCompletionThreshold,
  type QuizQuestion,
  type QuizVocabData,
} from "../../../src/course/quizUtils";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useTimeTracking } from "../../../src/hooks/useTimeTracking";
import { db } from "../../../src/services/firebase";
import { prefetchVocabularyCards } from "../../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../../src/stores";
import {
  CourseType,
  findRuntimeCourse,
  isJlptLevelCourseId,
} from "../../../src/types/vocabulary";
import { resolveQuizVocabulary } from "../../../src/utils/localizedVocabulary";

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

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
  useTimeTracking(); // Track time spent on this screen
  const { courseId, day, quizType } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    quizType: string;
  }>();
  const sanitizedQuizType = sanitizeRequestedQuizType(courseId, quizType);
  const resolvedQuizType = resolveRuntimeQuizType(sanitizedQuizType);
  const course = findRuntimeCourse(courseId);
  const dayNumber = parseInt(day || "1", 10);
  const showJlptPronunciationDetails = isJlptLevelCourseId(courseId);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [matchingMeanings, setMatchingMeanings] = useState<string[]>([]);
  const retakeMarkedRef = React.useRef(false);

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
    const fetchVocabulary = async () => {
      setLoading(true);
      try {
        const fetchedCards = await prefetchVocabularyCards(
          courseId as CourseType,
          dayNumber,
        );
        const fetchedVocab: QuizVocabData[] = fetchedCards.map((card) => {
          const resolved = resolveQuizVocabulary(card, i18n.language);
          return {
            word: resolved.word,
            meaning: resolved.meaning,
            pronunciation: resolved.pronunciation,
            pronunciationRoman: resolved.pronunciationRoman,
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

        const generatedQuestions = generateQuizQuestions(
          fetchedVocab,
          resolvedQuizType,
        );
        setQuestions(generatedQuestions);

        if (resolvedQuizType === "matching") {
          setMatchingMeanings(
            shuffleArray(generatedQuestions.map((q) => q.meaning)),
          );
        } else {
          setMatchingMeanings([]);
        }
      } catch (error) {
        console.error("Error fetching vocabulary for quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, [courseId, dayNumber, i18n.language, resolvedQuizType]);

  const currentQuestion = questions[currentIndex];
  const isMatching = resolvedQuizType === "matching";
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

  const handleAnswer = async (answer: string) => {
    const correct =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();
    const nextScore = correct ? score + 1 : score;
    console.log(
      `[Quiz] ${sanitizedQuizType} answer in handleAnswer`,
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

    // Auto-advance after showing feedback
    setTimeout(() => {
      setShowResult(false);
      setUserAnswer("");

      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setQuizFinished(true);
        saveQuizResult(nextScore);
      }
    }, 1500); // 1.5 seconds delay to show feedback
  };

  const handleMatchingAttempt = async (word: string, meaning: string) => {
    const correct = questions.find((q) => q.word === word)?.meaning === meaning;

    if (user) {
      bufferQuizAnswer(user.uid, correct);
    }

    console.log("[Quiz] matching attempt", correct ? "correct" : "incorrect", {
      word,
      meaning,
    });

    if (correct) {
      const nextScore = score + 1;
      setMatchedPairs((prev) => ({ ...prev, [word]: meaning }));
      setScore((prev) => prev + 1);
      await maybeMarkRetake(nextScore);
    }

    setSelectedWord(null);
    setSelectedMeaning(null);

    if (correct && Object.keys(matchedPairs).length + 1 === totalQuestions) {
      setQuizFinished(true);
      saveQuizResult(score + 1);
    }
  };

  const handleSelectWord = (word: string) => {
    if (matchedPairs[word]) return;
    if (selectedMeaning) {
      handleMatchingAttempt(word, selectedMeaning);
      return;
    }
    setSelectedWord(word);
  };

  const handleSelectMeaning = (meaning: string) => {
    if (Object.values(matchedPairs).includes(meaning)) return;
    if (selectedWord) {
      handleMatchingAttempt(selectedWord, meaning);
      return;
    }
    setSelectedMeaning(meaning);
  };

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
          quizType: sanitizedQuizType,
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

  const handleTimeUp = () => {
    if (isMatching) {
      // Matching game ends on time up
      setQuizFinished(true);
      saveQuizResult(score);
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
    Alert.alert(t("quiz.quit.title"), t("quiz.quit.message"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("quiz.quit.confirm"),
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
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

  const handleFinish = () => {
    router.back();
    router.back();
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer("");
    setShowResult(false);
    setQuizFinished(false);
    setSelectedWord(null);
    setSelectedMeaning(null);
    setMatchedPairs({});
  };

  // Show loading screen while fetching data
  if (loading || totalQuestions === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <Stack.Screen
          options={{
            title: t("quiz.typeTitle"),
            headerBackTitle: t("common.back"),
          }}
        />
        <LoadingView isDark={isDark} />
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
        <Stack.Screen
          options={{
            title: t("quiz.results.title"),
            headerBackTitle: t("common.back"),
          }}
        />
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
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: isMatching
            ? t("quiz.matching.progressTitle", {
                current: matchedCount,
                total: totalQuestions,
              })
            : t("quiz.questionTitle", {
                current: currentIndex + 1,
                total: totalQuestions,
              }),
          headerBackTitle: t("common.back"),
          headerLeft: () => (
            <TouchableOpacity onPress={handleQuit} hitSlop={8}>
              <Ionicons
                name="chevron-back"
                size={28}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          ),
        }}
      />
      {!quizFinished && !loading && (
        <QuizTimer
          duration={15}
          onTimeUp={handleTimeUp}
          isRunning={!showResult && !quizFinished}
          quizKey={isMatching ? "matching" : `${currentIndex}-${dayNumber}`}
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {isMatching ? (
          <View style={styles.matchingContent}>
            <GameBoard
              quizType={sanitizedQuizType}
              currentQuestion={currentQuestion}
              questions={questions}
              progressCurrent={progressCurrent}
              courseColor={course?.color}
              isDark={isDark}
              matchingMeanings={matchingMeanings}
              selectedWord={selectedWord}
              selectedMeaning={selectedMeaning}
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
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <GameBoard
              quizType={sanitizedQuizType}
              currentQuestion={currentQuestion}
              questions={questions}
              progressCurrent={progressCurrent}
              courseColor={course?.color}
              isDark={isDark}
              matchingMeanings={matchingMeanings}
              selectedWord={selectedWord}
              selectedMeaning={selectedMeaning}
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
