import { collection, getDocs, query } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { COURSES } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";
import { PopQuizSkeleton } from "./PopQuizSkeleton";

export function DashboardPopQuiz() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [quizItem, setQuizItem] = useState<{
    word: string;
    meaning: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const processSnapshot = useCallback((snapshot: any) => {
    const docs = snapshot.docs.map((d: any) => d.data());
    if (docs.length < 4) {
      setLoading(false);
      return; // Need at least 4 words for a quiz
    }

    // Pick random word
    const targetIndex = Math.floor(Math.random() * docs.length);
    const targetWord = docs[targetIndex];

    // Pick 3 distractors
    const distractors: string[] = [];
    const usedIndices = new Set([targetIndex]);

    while (distractors.length < 3) {
      const randIndex = Math.floor(Math.random() * docs.length);
      if (!usedIndices.has(randIndex)) {
        usedIndices.add(randIndex);
        distractors.push(docs[randIndex].meaning);
      }
    }

    const allOptions = [...distractors, targetWord.meaning];
    // Shuffle options
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    setQuizItem({ word: targetWord.word, meaning: targetWord.meaning });
    setOptions(allOptions);
    setLoading(false);
  }, []);

  const fetchQuizData = useCallback(async () => {
    setLoading(true);
    setSelectedOption(null);
    setIsCorrect(null);
    try {
      // Helper to get path for a course
      const getCoursePath = (courseId: string) => {
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
      };

      // Try to find data by attempting multiple courses and days
      const shuffledCourses = [...COURSES].sort(() => Math.random() - 0.5);
      const daysToTry = [1, 2, 3, 4, 5]; // Try Days 1-5

      for (const course of shuffledCourses) {
        const path = getCoursePath(course.id);
        if (!path) continue;

        // Shuffle days for variety
        const shuffledDays = [...daysToTry].sort(() => Math.random() - 0.5);

        for (const dayNum of shuffledDays) {
          const subCollectionName = `Day${dayNum}`;

          try {
            const q = query(collection(db, path, subCollectionName));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              console.log(
                `Found quiz data in ${course.id} - ${subCollectionName} (${snapshot.docs.length} words)`
              );
              processSnapshot(snapshot);
              return; // Success! Exit the function
            }
          } catch (error) {
            console.log(
              `Error checking ${course.id}/${subCollectionName}:`,
              error
            );
            // Continue to next day/course
          }
        }
      }

      // If we get here, no data was found in any course/day
      console.warn("No vocabulary data found in any course");
      setLoading(false);
    } catch (e) {
      console.error("Quiz fetch error", e);
      setLoading(false);
    }
  }, [processSnapshot]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

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

                  if (isAnswerCorrect) {
                    // Auto-advance to next question after brief delay
                    setTimeout(() => {
                      fetchQuizData();
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
  },
  popQuizQuestionLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  popQuizQuestionText: {
    fontSize: 20,
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
