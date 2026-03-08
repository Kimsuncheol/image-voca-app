import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuizTypeGrid, QuizTypeHeader } from "../../../components/course";
import { getQuizTypesForCourse } from "../../../src/course/quizModes";
import { useTheme } from "../../../src/context/ThemeContext";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

export default function QuizTypeSelectionScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();

  const course = COURSES.find((c) => c.id === courseId);
  const quizTypes = getQuizTypesForCourse(courseId);

  const handleQuizTypeSelect = (quizType: (typeof quizTypes)[number]) => {
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
