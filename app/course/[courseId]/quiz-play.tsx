import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
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
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useTimeTracking } from "../../../src/hooks/useTimeTracking";
import { db } from "../../../src/services/firebase";
import { useUserStatsStore } from "../../../src/stores";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

import nlp from "compromise";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  options?: string[];
  correctAnswer: string;
  clozeSentence?: string;
  translation?: string;
  correctForms?: string[];
  prompt?: string;
  highlightText?: string;
}

interface VocabData {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
  translation?: string;
}

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Helper to get Firestore path for a course
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

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Generate quiz questions from real vocabulary data
const generateQuizQuestions = (
  vocabData: VocabData[],
  quizType: string,
  targetScore: number = 10,
): QuizQuestion[] => {
  const selectedWords = shuffleArray([...vocabData]).slice(
    0,
    Math.min(targetScore, vocabData.length),
  );

  return selectedWords.map((vocab, index) => {
    const isWordAnswer = quizType === "fill-in-blank";

    let options: string[] | undefined;
    if (quizType === "multiple-choice") {
      const otherMeanings = vocabData
        .filter((v) => v.word !== vocab.word)
        .map((v) => v.meaning);
      const shuffledOthers = shuffleArray(otherMeanings);
      const wrongAnswers = shuffledOthers.slice(0, 3);

      options = shuffleArray([vocab.meaning, ...wrongAnswers]);
    }

    let clozeSentence: string | undefined;
    let translation: string | undefined;
    let correctForms: string[] | undefined;

    if (quizType === "fill-in-blank" && vocab.example) {
      const doc = nlp(vocab.example);
      const targetWord = vocab.word;
      const variations = new Set([targetWord, targetWord.toLowerCase()]);

      try {
        variations.add(nlp(targetWord).verbs().toPastTense().out());
        variations.add(nlp(targetWord).verbs().toPresentTense().out());
        variations.add(nlp(targetWord).verbs().toGerund().out());

        variations.add(nlp(targetWord).nouns().toPlural().out());
        variations.add(nlp(targetWord).nouns().toSingular().out());
      } catch {
        // Ignore unsupported transformations for unusual tokens.
      }

      const variationArray = Array.from(variations)
        .filter((v) => v)
        .map((v) => escapeRegex(v));

      const matchString = variationArray.map((v) => `\\b${v}\\b`).join("|");
      const matchRegex = new RegExp(matchString, "gi");

      const docText = doc.text();
      const matches = docText.match(matchRegex);

      if (matches && matches.length > 0) {
        correctForms = Array.from(matches);
        clozeSentence = docText.replace(matchRegex, "___");
      } else {
        const fallbackRegex = new RegExp(`\\b${vocab.word}[a-z]*\\b`, "gi");
        const fallbackMatches = vocab.example.match(fallbackRegex);
        correctForms = fallbackMatches ? Array.from(fallbackMatches) : [];
        clozeSentence = vocab.example.replace(fallbackRegex, "___");
      }

      translation = vocab.translation;

      const otherWords = vocabData
        .filter((v) => v.word !== vocab.word)
        .map((v) => v.word);
      const shuffledOthers = shuffleArray(otherWords);
      const wrongAnswers = shuffledOthers.slice(0, 3);

      options = shuffleArray([vocab.word, ...wrongAnswers]);
    }

    return {
      id: `q${index}`,
      word: vocab.word,
      meaning: vocab.meaning,
      options,
      correctAnswer: isWordAnswer ? vocab.word : vocab.meaning,
      clozeSentence,
      translation,
      correctForms,
    };
  });
};

export default function QuizPlayScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const {
    bufferQuizAnswer,
    flushQuizStats,
    stats,
    courseProgress,
    fetchCourseProgress,
    updateCourseDayProgress,
  } = useUserStatsStore();
  const targetScore = stats?.targetScore || 10;
  useTimeTracking(); // Track time spent on this screen
  const { courseId, day, quizType } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    quizType: string;
  }>();
  const sanitizedQuizType = sanitizeRequestedQuizType(courseId, quizType);
  const resolvedQuizType = resolveRuntimeQuizType(sanitizedQuizType);

  const course = COURSES.find((c) => c.id === courseId);
  const dayNumber = parseInt(day || "1", 10);

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
        const config = getCourseConfig(courseId as CourseType);

        if (!config.path) {
          console.error("No path configuration for course:", courseId);
          setLoading(false);
          return;
        }

        const subCollectionName = `Day${dayNumber}`;
        const targetCollection = collection(db, config.path, subCollectionName);

        const q = query(targetCollection);
        const querySnapshot = await getDocs(q);

        const fetchedVocab: VocabData[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          if (courseId === "COLLOCATION") {
            return {
              word: data.collocation,
              meaning: data.meaning,
              pronunciation: data.explanation,
              example: data.example,
              translation: data.translation,
            };
          }
          return {
            word: data.word,
            meaning: data.meaning,
            pronunciation: data.pronunciation,
            example: data.example,
            translation: data.translation,
          };
        });

        console.log(
          `Fetched ${fetchedVocab.length} words from ${subCollectionName} for quiz`,
        );

        if (fetchedVocab.length < 4) {
          console.warn("Not enough vocabulary for quiz (need at least 4)");
        }

        const generatedQuestions = generateQuizQuestions(
          fetchedVocab,
          resolvedQuizType,
          targetScore,
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
        console.log("Stats:", targetScore);
      }
    };

    fetchVocabulary();
  }, [courseId, dayNumber, resolvedQuizType, targetScore]);

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

      if (totalCorrect < targetScore) return;

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
      targetScore,
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
      const didReachTarget = accumulatedCorrect >= targetScore;

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
            // matchingFeedback={matchingFeedback} // Removed
            onSelectWord={handleSelectWord}
            onSelectMeaning={handleSelectMeaning}
            userAnswer={userAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
            onAnswer={(answer) => {
              setUserAnswer(answer);
              handleAnswer(answer);
            }}
          />
        </ScrollView>
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
