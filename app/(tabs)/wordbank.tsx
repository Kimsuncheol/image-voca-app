import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { TopInstallNativeAd } from "../../components/ads/TopInstallNativeAd";
import { WordBankCourseGrid, WordBankHeader } from "../../components/wordbank";
import { StudyModeProvider } from "../../src/hooks/useStudyMode";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
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
  const { user } = useAuth();
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const { learningLanguage } = useLearningLanguage();

  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (user) {
        getDocs(collection(db, "vocabank", user.uid, "course")).then((snap) => {
          const counts: Record<string, number> = {};
          snap.forEach((doc) => {
            counts[doc.id] = (doc.data().words ?? []).length;
          });
          setWordCounts(counts);
        });
      }
    }, [user])
  );

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
          wordCounts={wordCounts}
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
