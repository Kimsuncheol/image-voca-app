import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuizTypeGrid, QuizTypeHeader } from "../../../components/course";
import { getQuizTypesForCourse } from "../../../src/course/quizModes";
import { useTheme } from "../../../src/context/ThemeContext";
import { prefetchVocabularyCards } from "../../../src/services/vocabularyPrefetch";
import {
  CourseType,
  findRuntimeCourse,
  isJlptLevelCourseId,
  isKanjiWord,
} from "../../../src/types/vocabulary";
import { isPronunciationMatchEligible } from "../../../src/utils/pronunciationMatching";

export default function QuizTypeSelectionScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();

  const course = findRuntimeCourse(courseId);
  const [quizTypes, setQuizTypes] = useState(() => getQuizTypesForCourse(courseId));

  useEffect(() => {
    let isMounted = true;

    const loadQuizTypes = async () => {
      const baseQuizTypes = getQuizTypesForCourse(courseId);
      if (courseId !== "TOEFL_IELTS" && !isJlptLevelCourseId(courseId)) {
        if (isMounted) {
          setQuizTypes(baseQuizTypes);
        }
        return;
      }

      try {
        const cards = await prefetchVocabularyCards(
          courseId as CourseType,
          parseInt(day || "1", 10),
        );

        if (!isMounted) {
          return;
        }

        if (courseId === "TOEFL_IELTS") {
          setQuizTypes(baseQuizTypes);
          return;
        }

        const pronunciationEligibleCount = cards.filter((card) => {
          if (isKanjiWord(card)) {
            const reading = card.reading
              .map((value) => value.trim())
              .find(Boolean);
            return isPronunciationMatchEligible(card.kanji, reading);
          }

          return isPronunciationMatchEligible(card.word, card.pronunciation);
        }).length;

        setQuizTypes(
          pronunciationEligibleCount >= 4
            ? baseQuizTypes
            : baseQuizTypes.filter(
                (quizType) => quizType.id !== "pronunciation-matching",
              ),
        );
      } catch (error) {
        console.error("Failed to load conditional quiz availability:", error);
        if (isMounted) {
          setQuizTypes(
            courseId === "TOEFL_IELTS"
              ? baseQuizTypes
              : baseQuizTypes.filter(
                  (quizType) => quizType.id !== "pronunciation-matching",
                ),
          );
        }
      }
    };

    void loadQuizTypes();

    return () => {
      isMounted = false;
    };
  }, [courseId, day]);

  const handleQuizTypeSelect = (quizType: { id: string }) => {
    router.push({
      pathname: "/course/[courseId]/quiz-play",
      params: { courseId, day, quizType: quizType.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["left", "right", "bottom"]}
    >
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: isDark ? "#000" : "#fff" },
          headerShadowVisible: false,
          title: t("quiz.typeTitle"),
          headerBackTitle: t("common.back"),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <QuizTypeHeader course={course} day={day} />
        <QuizTypeGrid
          quizTypes={quizTypes}
          onQuizTypeSelect={handleQuizTypeSelect}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
