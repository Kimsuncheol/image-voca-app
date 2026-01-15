import { collection, getDocs, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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

  const fetchQuizData = async () => {
    setLoading(true);
    setSelectedOption(null);
    setIsCorrect(null);
    try {
      // 1. Pick a random course
      const randomCourse = COURSES[Math.floor(Math.random() * COURSES.length)];

      // 2. Get config (duplicated helper logic for now)
      let path = "";
      let prefix = "";

      switch (randomCourse.id) {
        case "수능":
          path = process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "";
          prefix = "CSAT";
          break;
        case "TOEIC":
          path = process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "";
          prefix = "TOEIC";
          break;
        case "TOEFL":
          path = process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL || "";
          prefix = "TOEFL";
          break;
        case "TOEIC_SPEAKING":
          path = process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING || "";
          prefix = "TOEIC_SPEAKING";
          break;
        case "IELTS":
          path = process.env.EXPO_PUBLIC_COURSE_PATH_IELTS || "";
          prefix = "IELTS";
          break;
        case "OPIC":
          path = process.env.EXPO_PUBLIC_COURSE_PATH_OPIC || "";
          prefix = "OPIc";
          break;
      }

      if (!path) {
        console.warn("No path for course", randomCourse.id);
        setLoading(false);
        return;
      }

      // 3. Fetch from Day 1 (assuming data exists there for now)
      const subCollectionName = `${prefix}1_Day1`;
      const q = query(collection(db, path, subCollectionName));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log(`No data in ${subCollectionName}, defaulting...`);
        // Consider retrying or just returning (will stay loading or show empty)
        // For now, let's try CSAT Day 1 as fallback if we didn't pick it
        if (prefix !== "CSAT") {
          const csatPath = process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "";
          if (csatPath) {
            const fallbackSnap = await getDocs(
              query(collection(db, csatPath, "CSAT1_Day1"))
            );
            if (!fallbackSnap.empty) {
              processSnapshot(fallbackSnap);
              return;
            }
          }
        }
        setLoading(false);
        return;
      }

      processSnapshot(snapshot);
    } catch (e) {
      console.error("Quiz fetch error", e);
      setLoading(false);
    }
  };

  const processSnapshot = (snapshot: any) => {
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
  };

  useEffect(() => {
    fetchQuizData();
  }, []);

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
