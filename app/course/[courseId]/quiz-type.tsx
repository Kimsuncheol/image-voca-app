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

const QUIZ_TYPES_GROUP_A: QuizType[] = [
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
    id: "fill-in-blank",
    title: "Fill in the Blank",
    titleKey: "quiz.types.fillInBlank.title",
    description: "Complete the sentence",
    descriptionKey: "quiz.types.fillInBlank.description",
    icon: "create-outline",
    color: "#4ECDC4",
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

const QUIZ_TYPES_GROUP_B: QuizType[] = [
  {
    id: "gap-fill-sentence",
    title: "Gap-Fill Sentence",
    titleKey: "quiz.types.gapFillSentence.title",
    description: "Complete the collocation in a sentence",
    descriptionKey: "quiz.types.gapFillSentence.description",
    icon: "create-outline",
    color: "#4ECDC4",
  },
  {
    id: "collocation-matching",
    title: "Matching",
    titleKey: "quiz.types.collocationMatching.title",
    description: "Match collocations with meanings",
    descriptionKey: "quiz.types.collocationMatching.description",
    icon: "git-compare",
    color: "#FFE66D",
  },
  {
    id: "error-correction",
    title: "Error Correction",
    titleKey: "quiz.types.errorCorrection.title",
    description: "Fix the incorrect collocation",
    descriptionKey: "quiz.types.errorCorrection.description",
    icon: "alert-circle",
    color: "#FF8A65",
  },
  {
    id: "word-order-tiles",
    title: "Word Order Tiles",
    titleKey: "quiz.types.wordOrderTiles.title",
    description: "Arrange tiles to form the sentence",
    descriptionKey: "quiz.types.wordOrderTiles.description",
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
  const quizTypes =
    courseId === "COLLOCATION" ? QUIZ_TYPES_GROUP_B : QUIZ_TYPES_GROUP_A;

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
