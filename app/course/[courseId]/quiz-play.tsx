import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../../components/themed-text";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useTimeTracking } from "../../../src/hooks/useTimeTracking";
import { db } from "../../../src/services/firebase";
import { useUserStatsStore } from "../../../src/stores";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  options?: string[];
  correctAnswer: string;
}

interface VocabData {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
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
    case "TOEIC_SPEAKING":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING,
        prefix: "TOEIC_SPEAKING",
      };
    case "IELTS":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_IELTS,
        prefix: "IELTS",
      };
    case "OPIC":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_OPIC,
        prefix: "OPIc",
      };
    default:
      return { path: "", prefix: "" };
  }
};

// Generate quiz questions from real vocabulary data
const generateQuizQuestions = (
  vocabData: VocabData[],
  quizType: string
): QuizQuestion[] => {
  // Shuffle and take random questions (up to 10)
  const selectedWords = shuffleArray([...vocabData]).slice(
    0,
    Math.min(10, vocabData.length)
  );

  return selectedWords.map((vocab, index) => {
    const isWordAnswer = quizType === "fill-blank" || quizType === "spelling";

    // Generate options for multiple choice
    let options: string[] | undefined;
    if (quizType === "multiple-choice") {
      // Get 3 random wrong answers
      const otherMeanings = vocabData
        .filter((v) => v.word !== vocab.word)
        .map((v) => v.meaning);
      const shuffledOthers = shuffleArray(otherMeanings);
      const wrongAnswers = shuffledOthers.slice(0, 3);

      // Combine and shuffle
      options = shuffleArray([vocab.meaning, ...wrongAnswers]);
    }

    return {
      id: `q${index}`,
      word: vocab.word,
      meaning: vocab.meaning,
      options,
      correctAnswer: isWordAnswer ? vocab.word : vocab.meaning,
    };
  });
};

export default function QuizPlayScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { recordQuizAnswer } = useUserStatsStore();
  useTimeTracking(); // Track time spent on this screen
  const { courseId, day, quizType } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    quizType: string;
  }>();

  const course = COURSES.find((c) => c.id === courseId);
  const dayNumber = parseInt(day || "1", 10);

  const [loading, setLoading] = useState(true);
  const [vocabularyData, setVocabularyData] = useState<VocabData[]>([]);
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
  const [matchingFeedback, setMatchingFeedback] = useState<string | null>(null);
  const [matchingMeanings, setMatchingMeanings] = useState<string[]>([]);

  // Fetch vocabulary data from Firestore
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
          return {
            word: data.word,
            meaning: data.meaning,
            pronunciation: data.pronunciation,
            example: data.example,
          };
        });

        console.log(
          `Fetched ${fetchedVocab.length} words from ${subCollectionName} for quiz`
        );

        if (fetchedVocab.length < 4) {
          console.warn("Not enough vocabulary for quiz (need at least 4)");
        }

        setVocabularyData(fetchedVocab);

        // Generate quiz questions from fetched data
        const generatedQuestions = generateQuizQuestions(
          fetchedVocab,
          quizType || "multiple-choice"
        );
        setQuestions(generatedQuestions);

        // Set up matching meanings if it's a matching quiz
        if (quizType === "matching") {
          setMatchingMeanings(
            shuffleArray(generatedQuestions.map((q) => q.meaning))
          );
        }
      } catch (error) {
        console.error("Error fetching vocabulary for quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, [courseId, dayNumber, quizType]);

  const currentQuestion = questions[currentIndex];
  const isMatching = quizType === "matching";
  const isSpelling = quizType === "spelling";
  const matchedCount = Object.keys(matchedPairs).length;
  const progressCurrent = isMatching ? matchedCount : currentIndex + 1;

  const handleAnswer = async (answer: string) => {
    const correct =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    // Record answer for stats
    if (user) {
      await recordQuizAnswer(user.uid, correct);
    }

    // Auto-advance after showing feedback
    setTimeout(() => {
      setShowResult(false);
      setUserAnswer("");

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setQuizFinished(true);
        saveQuizResult();
      }
    }, 1500); // 1.5 seconds delay to show feedback
  };

  const handleMatchingAttempt = async (word: string, meaning: string) => {
    const correct = questions.find((q) => q.word === word)?.meaning === meaning;
    setMatchingFeedback(
      correct ? t("quiz.feedback.correct") : t("quiz.feedback.incorrect")
    );

    if (user) {
      await recordQuizAnswer(user.uid, correct);
    }

    if (correct) {
      setMatchedPairs((prev) => ({ ...prev, [word]: meaning }));
      setScore((prev) => prev + 1);
    }

    setSelectedWord(null);
    setSelectedMeaning(null);

    if (correct && Object.keys(matchedPairs).length + 1 === questions.length) {
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
    if (!user) return;

    const resolvedScore = finalScore ?? score;
    const percentage = Math.round((resolvedScore / questions.length) * 100);

    try {
      // Save quiz result to Firestore
      await setDoc(
        doc(db, "quiz", user.uid, "course", `${courseId}-day${day}`),
        {
          courseId,
          day: dayNumber,
          quizType,
          score: resolvedScore,
          totalQuestions: questions.length,
          percentage,
          completedAt: new Date().toISOString(),
        }
      );

      // Update course progress
      await updateDoc(doc(db, "users", user.uid), {
        [`courseProgress.${courseId}.${dayNumber}.quizCompleted`]: true,
        [`courseProgress.${courseId}.${dayNumber}.quizScore`]: percentage,
      });
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

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
    setMatchingFeedback(null);
  };

  // Show loading screen while fetching data
  if (loading || questions.length === 0) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>
            {t("common.loading")}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
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
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.scoreCircle,
              {
                borderColor:
                  percentage >= 80
                    ? "#28a745"
                    : percentage >= 60
                    ? "#ffc107"
                    : "#dc3545",
              },
            ]}
          >
            <ThemedText type="title" style={styles.scoreText}>
              {percentage}%
            </ThemedText>
            <ThemedText style={styles.scoreLabel}>
              {score}/{questions.length}
            </ThemedText>
          </View>

          <ThemedText type="subtitle" style={styles.resultMessage}>
            {percentage >= 80
              ? t("quiz.results.excellent")
              : percentage >= 60
              ? t("quiz.results.goodJob")
              : t("quiz.results.keepPracticing")}
          </ThemedText>

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultButton, styles.retryButton]}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <ThemedText style={styles.resultButtonText}>
                {t("common.retry")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultButton, styles.finishButton]}
              onPress={handleFinish}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <ThemedText style={styles.resultButtonText}>
                {t("common.finish")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: isMatching
            ? t("quiz.matching.progressTitle", {
                current: matchedCount,
                total: questions.length,
              })
            : t("quiz.questionTitle", {
                current: currentIndex + 1,
                total: questions.length,
              }),
          headerBackTitle: t("common.back"),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: isDark ? "#333" : "#e0e0e0" },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(progressCurrent / questions.length) * 100}%`,
                    backgroundColor: course?.color || "#007AFF",
                  },
                ]}
              />
            </View>
            <ThemedText style={styles.progressText}>
              {progressCurrent} / {questions.length}
            </ThemedText>
          </View>

          {/* Question Card */}
          {!isMatching && (
            <View
              style={[
                styles.questionCard,
                { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
              ]}
            >
              {quizType === "fill-blank" || isSpelling ? (
                <>
                  <ThemedText style={styles.questionLabel}>
                    {isSpelling
                      ? t("quiz.questions.spellPrompt")
                      : t("quiz.questions.matchMeaning")}
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.questionText}>
                    {currentQuestion.meaning}
                  </ThemedText>
                </>
              ) : (
                <>
                  <ThemedText style={styles.questionLabel}>
                    {t("quiz.questions.meaningOf")}
                  </ThemedText>
                  <ThemedText type="title" style={styles.wordText}>
                    {currentQuestion.word}
                  </ThemedText>
                </>
              )}
            </View>
          )}

          {/* Answer Section */}
          {quizType === "fill-blank" || isSpelling ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5",
                    color: isDark ? "#fff" : "#000",
                  },
                  showResult && {
                    borderColor: isCorrect ? "#28a745" : "#dc3545",
                    borderWidth: 2,
                  },
                ]}
                placeholder={
                  isSpelling
                    ? t("quiz.actions.typeSpelling")
                    : t("quiz.actions.typeAnswer")
                }
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={userAnswer}
                onChangeText={setUserAnswer}
                editable={!showResult}
                autoCapitalize="none"
              />
              {!showResult && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: course?.color || "#007AFF" },
                  ]}
                  onPress={() => handleAnswer(userAnswer)}
                  disabled={!userAnswer.trim()}
                >
                  <ThemedText style={styles.submitButtonText}>
                    {t("common.submit")}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : isMatching ? (
            <View style={styles.matchingContainer}>
              <ThemedText style={styles.matchingHint}>
                {t("quiz.matching.instructions")}
              </ThemedText>
              <View style={styles.matchingColumns}>
                <View style={styles.matchingColumn}>
                  {questions.map((question) => {
                    const isMatched = Boolean(matchedPairs[question.word]);
                    const isSelected = selectedWord === question.word;
                    return (
                      <TouchableOpacity
                        key={question.word}
                        style={[
                          styles.matchingItem,
                          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                          isMatched && styles.matchingItemMatched,
                          isSelected && styles.matchingItemSelected,
                        ]}
                        onPress={() => handleSelectWord(question.word)}
                        disabled={isMatched}
                      >
                        <ThemedText
                          style={[
                            styles.matchingItemText,
                            isMatched && styles.matchingItemTextMatched,
                          ]}
                        >
                          {question.word}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.matchingColumn}>
                  {matchingMeanings.map((meaning) => {
                    const isMatched =
                      Object.values(matchedPairs).includes(meaning);
                    const isSelected = selectedMeaning === meaning;
                    return (
                      <TouchableOpacity
                        key={meaning}
                        style={[
                          styles.matchingItem,
                          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                          isMatched && styles.matchingItemMatched,
                          isSelected && styles.matchingItemSelected,
                        ]}
                        onPress={() => handleSelectMeaning(meaning)}
                        disabled={isMatched}
                      >
                        <ThemedText
                          style={[
                            styles.matchingItemText,
                            isMatched && styles.matchingItemTextMatched,
                          ]}
                        >
                          {meaning}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {matchingFeedback && (
                <ThemedText style={styles.matchingFeedback}>
                  {matchingFeedback}
                </ThemedText>
              )}
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {currentQuestion.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                    showResult &&
                      option === currentQuestion.correctAnswer && {
                        backgroundColor: "#28a74520",
                        borderColor: "#28a745",
                        borderWidth: 2,
                      },
                    showResult &&
                      option !== currentQuestion.correctAnswer &&
                      userAnswer === option && {
                        backgroundColor: "#dc354520",
                        borderColor: "#dc3545",
                        borderWidth: 2,
                      },
                  ]}
                  onPress={() => {
                    if (!showResult) {
                      setUserAnswer(option);
                      handleAnswer(option);
                    }
                  }}
                  disabled={showResult}
                >
                  <ThemedText style={styles.optionText}>{option}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Result Feedback */}
          {showResult && !isMatching && !isCorrect && (
            <View style={styles.feedbackContainer}>
              <View
                style={[styles.feedbackBadge, { backgroundColor: "#dc3545" }]}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
                <ThemedText style={styles.feedbackText}>
                  {t("quiz.feedback.incorrect")}
                </ThemedText>
              </View>
              <ThemedText style={styles.correctAnswerText}>
                {t("quiz.feedback.correctAnswer", {
                  answer: currentQuestion.correctAnswer,
                })}
              </ThemedText>
            </View>
          )}
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
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
  },
  questionCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  questionLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
  },
  wordText: {
    fontSize: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 12,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
  },
  matchingContainer: {
    gap: 12,
    marginBottom: 24,
  },
  matchingHint: {
    fontSize: 14,
    opacity: 0.6,
  },
  matchingColumns: {
    flexDirection: "row",
    gap: 12,
  },
  matchingColumn: {
    flex: 1,
    gap: 8,
  },
  matchingItem: {
    padding: 12,
    borderRadius: 12,
  },
  matchingItemSelected: {
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  matchingItemMatched: {
    backgroundColor: "#28a74520",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  matchingItemText: {
    fontSize: 14,
    textAlign: "center",
  },
  matchingItemTextMatched: {
    opacity: 0.6,
  },
  matchingFeedback: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  feedbackContainer: {
    alignItems: "center",
    gap: 16,
  },
  feedbackBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  correctAnswerText: {
    fontSize: 14,
    opacity: 0.8,
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
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
  },
  scoreLabel: {
    fontSize: 16,
    opacity: 0.6,
  },
  resultMessage: {
    fontSize: 24,
    marginBottom: 32,
  },
  resultButtons: {
    flexDirection: "row",
    gap: 16,
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  retryButton: {
    backgroundColor: "#6c757d",
  },
  finishButton: {
    backgroundColor: "#28a745",
  },
  resultButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
