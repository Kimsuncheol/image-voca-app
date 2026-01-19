import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuizTypeGrid, QuizTypeHeader } from "../../../components/course";
import { useTheme } from "../../../src/context/ThemeContext";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

interface QuizType {
  id: string;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
}

const QUIZ_TYPES: QuizType[] = [
  {
    id: "multiple-choice",
    title: "Multiple Choice",
    titleKey: "quiz.types.multipleChoice.title",
    description: "Choose the correct meaning",
    descriptionKey: "quiz.types.multipleChoice.description",
    icon: "list",
    color: "#FF6B6B",
  },
  {
    id: "matching",
    title: "Matching",
    titleKey: "quiz.types.matching.title",
    description: "Match words with meanings",
    descriptionKey: "quiz.types.matching.description",
    icon: "git-compare",
    color: "#FFE66D",
  },
  {
    id: "spelling",
    title: "Spelling",
    titleKey: "quiz.types.spelling.title",
    description: "Spell the word correctly",
    descriptionKey: "quiz.types.spelling.description",
    icon: "text",
    color: "#DDA0DD",
  },
  {
    id: "word-arrangement",
    title: "Word Arrangement",
    titleKey: "quiz.types.wordArrangement.title",
    description: "Arrange words to form a sentence",
    descriptionKey: "quiz.types.wordArrangement.description",
    icon: "reorder-four",
    color: "#9B59B6",
  },
];

export default function QuizTypeSelectionScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();

  const course = COURSES.find((c) => c.id === courseId);

  const handleQuizTypeSelect = (quizType: QuizType) => {
    router.push({
      pathname: "/course/[courseId]/quiz-play",
      params: { courseId, day, quizType: quizType.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
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
          quizTypes={QUIZ_TYPES}
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
