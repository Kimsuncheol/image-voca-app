import { collection, getDocs, query } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { COURSES } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";
import { PopQuizSkeleton } from "./PopQuizSkeleton";

export function DashboardPopQuiz() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bufferQuizAnswer, flushQuizStats } = useUserStatsStore();

  // Batch prefetch state
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [nextBatch, setNextBatch] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // Quiz state
  const [quizItem, setQuizItem] = useState<{
    word: string;
    meaning: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Helper to get course path
  const getCoursePath = useCallback((courseId: string) => {
    switch (courseId) {
      case "수능":
        return process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "";
      case "TOEIC":
        return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "";
      case "TOEFL":
        return process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL || "";
      case "TOEIC_SPEAKING":
        return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING || "";
      case "IELTS":
        return process.env.EXPO_PUBLIC_COURSE_PATH_IELTS || "";
      case "OPIC":
        return process.env.EXPO_PUBLIC_COURSE_PATH_OPIC || "";
      default:
        return "";
    }
  }, []);

  // Fetch a batch of 10 words
  const fetchBatch = useCallback(async () => {
    try {
      const shuffledCourses = [...COURSES].sort(() => Math.random() - 0.5);
      const daysToTry = [1, 2, 3, 4, 5];

      for (const course of shuffledCourses) {
        const path = getCoursePath(course.id);
        if (!path) continue;

        const shuffledDays = [...daysToTry].sort(() => Math.random() - 0.5);

        for (const dayNum of shuffledDays) {
          const subCollectionName = `Day${dayNum}`;

          try {
            const q = query(collection(db, path, subCollectionName));
            const snapshot = await getDocs(q);

            if (!snapshot.empty && snapshot.docs.length >= 10) {
              // Shuffle and take 10 words
              const allDocs = snapshot.docs.map((d) => d.data());
              const shuffled = allDocs.sort(() => Math.random() - 0.5);
              const batch = shuffled.slice(0, 10);

              console.log(
                `Fetched batch from ${course.id} - ${subCollectionName} (${batch.length} words)`,
              );
              return batch;
            }
          } catch (error) {
            console.log(
              `Error checking ${course.id}/${subCollectionName}:`,
              error,
            );
          }
        }
      }

      console.warn("No vocabulary data found in any course");
      return [];
    } catch (e) {
      console.error("Batch fetch error", e);
      return [];
    }
  }, [getCoursePath]);

  // Prefetch next batch
  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching) return;

    setIsPrefetching(true);
    const batch = await fetchBatch();
    setNextBatch(batch);
    setIsPrefetching(false);
    console.log("Prefetched next batch");
  }, [fetchBatch, isPrefetching]);

  // Generate quiz from current word
  const generateQuiz = useCallback((wordData: any, batch: any[]) => {
    if (batch.length < 4) return;

    // Use wordData as target
    const targetWord = wordData;

    // Pick 3 distractors from batch
    const distractors: string[] = [];
    const availableWords = batch.filter((w) => w.word !== targetWord.word);

    while (distractors.length < 3 && availableWords.length > 0) {
      const randIndex = Math.floor(Math.random() * availableWords.length);
      distractors.push(availableWords[randIndex].meaning);
      availableWords.splice(randIndex, 1);
    }

    // Shuffle options
    const allOptions = [...distractors, targetWord.meaning];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    setQuizItem({ word: targetWord.word, meaning: targetWord.meaning });
    setOptions(allOptions);
  }, []);

  // Load next quiz from current batch
  const loadNextQuiz = useCallback(() => {
    if (currentBatch.length === 0) return;

    const newIndex = currentIndex + 1;

    // Check if we need to switch batches
    if (newIndex >= 10) {
      if (nextBatch.length > 0) {
        console.log(`Switching to next batch (turn ${turnNumber + 1})`);
        setCurrentBatch(nextBatch);
        setNextBatch([]);
        setCurrentIndex(0);
        setTurnNumber((prev) => prev + 1);
        generateQuiz(nextBatch[0], nextBatch);
      } else {
        // No next batch, fetch new one
        setLoading(true);
      }
      return;
    }

    // Prefetch at position 10*n - 3 (e.g., 7, 17, 27...)
    if (newIndex === 10 * turnNumber - 3 && nextBatch.length === 0) {
      console.log(`Prefetching at position ${newIndex}`);
      prefetchNextBatch();
    }

    setCurrentIndex(newIndex);
    generateQuiz(currentBatch[newIndex], currentBatch);
  }, [
    currentBatch,
    currentIndex,
    nextBatch,
    turnNumber,
    generateQuiz,
    prefetchNextBatch,
  ]);

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

  // Animate on quiz change
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

  // Flush stats on unmount
  useEffect(() => {
    return () => {
      if (user) {
        flushQuizStats(user.uid);
      }
    };
  }, [user, flushQuizStats]);

  if (loading || !quizItem) return <PopQuizSkeleton />;

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.popQuiz.title")}
      </ThemedText>
      <View
        style={[
          styles.popQuizCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <View style={styles.popQuizHeader}>
          <View>
            <ThemedText type="subtitle" style={styles.popQuizTitle}>
              {t("dashboard.popQuiz.headline")}
            </ThemedText>
            <ThemedText style={styles.popQuizSubtitle}>
              {t("dashboard.popQuiz.subtitle")}
            </ThemedText>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.popQuizQuestion}>
            <ThemedText style={styles.popQuizQuestionLabel}>
              {t("dashboard.popQuiz.question")}
            </ThemedText>
            <ThemedText style={styles.popQuizQuestionText}>
              {quizItem.word}
            </ThemedText>
          </View>

          <View style={styles.popQuizOptions}>
            {options.map((option, index) => {
              const selected = selectedOption === option;
              const correct = option === quizItem.meaning;
              return (
                <TouchableOpacity
                  key={`${option}-${index}`}
                  style={[
                    styles.popQuizOption,
                    { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                    selected &&
                      (correct
                        ? styles.popQuizOptionCorrect
                        : styles.popQuizOptionIncorrect),
                  ]}
                  onPress={() => {
                    if (isCorrect) return; // Only lock if already answered correctly

                    const isAnswerCorrect = option === quizItem.meaning;
                    setSelectedOption(option);
                    setIsCorrect(isAnswerCorrect);

                    // Record quiz answer for accuracy stats
                    if (user) {
                      bufferQuizAnswer(user.uid, isAnswerCorrect);
                    }

                    if (isAnswerCorrect) {
                      // Auto-advance to next question after brief delay
                      setTimeout(() => {
                        setSelectedOption(null);
                        setIsCorrect(null);
                        loadNextQuiz();
                      }, 500);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.popQuizOptionText}>
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  popQuizCard: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  popQuizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  popQuizTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  popQuizSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  popWordBadge: {
    backgroundColor: "#ffedcc",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  popWordLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    opacity: 0.7,
    marginBottom: 2,
  },
  popWordText: {
    fontSize: 18,
    fontWeight: "700",
  },
  popQuizQuestion: {
    gap: 4,
    marginBottom: 16,
  },
  popQuizQuestionLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  popQuizQuestionText: {
    fontSize: 24,
    fontWeight: "700",
  },
  popQuizOptions: {
    gap: 8,
  },
  popQuizOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  popQuizOptionText: {
    fontSize: 14,
  },
  popQuizOptionCorrect: {
    borderColor: "#28a745",
    backgroundColor: "#28a74520",
  },
  popQuizOptionIncorrect: {
    borderColor: "#dc3545",
    backgroundColor: "#dc354520",
  },
  popQuizFeedback: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  feedbackContainer: {
    alignItems: "center",
    gap: 10,
  },
  nextButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
