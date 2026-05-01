import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { TopInstallNativeAd } from "../../components/ads/TopInstallNativeAd";
import { WordBankCourseGrid, WordBankHeader } from "../../components/wordbank";
import { StudyModeProvider } from "../../src/hooks/useStudyMode";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { useTheme } from "../../src/context/ThemeContext";
import { CourseType, getTopLevelCoursesForLanguage } from "../../src/types/vocabulary";

export default function WordBankScreen() {
  return (
    <StudyModeProvider keepAwakeTag="WordBankScreen">
      <WordBankScreenContent />
    </StudyModeProvider>
  );
}

function WordBankScreenContent() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const { learningLanguage } = useLearningLanguage();

  const handleCoursePress = (courseId: CourseType) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    if (courseId === "JLPT") {
      router.push("/courses/jlpt-levels");
    } else {
      router.push({
        pathname: "/courses/[course]",
        params: { course: courseId },
      });
    }
    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  };

  const courses = getTopLevelCoursesForLanguage(learningLanguage);

  return (
    <View
      style={[styles.container, { backgroundColor: bgColors.screen }]}
    >
      <TopInstallNativeAd />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WordBankHeader />
        <WordBankCourseGrid
          courses={courses}
          onCoursePress={handleCoursePress}
        />
      </ScrollView>
    </View>
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
