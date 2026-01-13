import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../../components/themed-text";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
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

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Generate quiz questions from vocabulary
const generateQuizQuestions = (
  course: CourseType,
  day: number,
  quizType: string
): QuizQuestion[] => {
  const words = [
    { word: "Serendipity", meaning: "Finding something good by chance" },
    { word: "Ephemeral", meaning: "Lasting for a very short time" },
    { word: "Luminous", meaning: "Full of or shedding light" },
    { word: "Solitude", meaning: "The state of being alone" },
    { word: "Aurora", meaning: "Natural light display in the sky" },
  ];

  return words.map((w, index) => {
    const isWordAnswer = quizType === "fill-blank" || quizType === "spelling";
    return {
      id: `${course}-day${day}-q${index}`,
      word: w.word,
      meaning: w.meaning,
      options:
        quizType === "multiple-choice"
          ? shuffleArray([
              w.meaning,
              "A type of food",
              "A musical instrument",
              "A weather phenomenon",
            ])
          : undefined,
      correctAnswer: isWordAnswer ? w.word : w.meaning,
    };
  });
};

export default function QuizPlayScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { recordQuizAnswer } = useUserStatsStore();
  const { courseId, day, quizType } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    quizType: string;
  }>();

  const course = COURSES.find((c) => c.id === courseId);
  const dayNumber = parseInt(day || "1", 10);

  const [questions] = useState(() =>
    generateQuizQuestions(courseId as CourseType, dayNumber, quizType || "multiple-choice")
  );
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
  const [matchingMeanings] = useState(() =>
    shuffleArray(questions.map((question) => question.meaning))
  );

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

  const handleNext = () => {
    setShowResult(false);
    setUserAnswer("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      saveQuizResult();
    }
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

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
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
                    const isMatched = Object.values(matchedPairs).includes(
                      meaning
                    );
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
          {showResult && !isMatching && (
            <View style={styles.feedbackContainer}>
              <View
                style={[
                  styles.feedbackBadge,
                  { backgroundColor: isCorrect ? "#28a745" : "#dc3545" },
                ]}
              >
                <Ionicons
                  name={isCorrect ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color="#fff"
                />
                <ThemedText style={styles.feedbackText}>
                  {isCorrect ? t("quiz.feedback.correct") : t("quiz.feedback.incorrect")}
                </ThemedText>
              </View>
              {!isCorrect && (
                <ThemedText style={styles.correctAnswerText}>
                  {t("quiz.feedback.correctAnswer", {
                    answer: currentQuestion.correctAnswer,
                  })}
                </ThemedText>
              )}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: course?.color || "#007AFF" },
                ]}
                onPress={handleNext}
              >
                <ThemedText style={styles.nextButtonText}>
                  {currentIndex < questions.length - 1
                    ? t("common.next")
                    : t("quiz.seeResults")}
                </ThemedText>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
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
});
