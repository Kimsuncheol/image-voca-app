import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { TopInstallNativeAd } from "../../components/ads/TopInstallNativeAd";
import { WordBankCourseGrid, WordBankHeader } from "../../components/wordbank";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useTimeTracking } from "../../src/hooks/useTimeTracking";
import { db } from "../../src/services/firebase";
import { useSubscriptionStore } from "../../src/stores";
import { CourseType, getTopLevelCoursesForLanguage } from "../../src/types/vocabulary";

export default function WordBankScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { learningLanguage } = useLearningLanguage();
  const { fetchSubscription } = useSubscriptionStore();
  useTimeTracking(); // Track time spent on this screen

  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSubscription(user.uid);
        getDocs(collection(db, "vocabank", user.uid, "course")).then((snap) => {
          const counts: Record<string, number> = {};
          snap.forEach((doc) => {
            counts[doc.id] = (doc.data().words ?? []).length;
          });
          setWordCounts(counts);
        });
      }
    }, [fetchSubscription, user])
  );

  const handleCoursePress = (courseId: CourseType) => {
    if (courseId === "JLPT") {
      router.push("/courses/jlpt-levels");
      return;
    }
    router.push({
      pathname: "/courses/[course]",
      params: { course: courseId },
    });
  };

  const courses = getTopLevelCoursesForLanguage(learningLanguage);

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
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
