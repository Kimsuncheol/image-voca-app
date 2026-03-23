import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  AllCoursesSection,
  RecentCourseSection,
  VocaHeader,
} from "../../components/course";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useSubscriptionStore } from "../../src/stores";
import {
  Course,
  findRuntimeCourse,
  getTopLevelCoursesForLanguage,
  isJlptParentCourseId,
} from "../../src/types/vocabulary";

export default function CourseSelectionScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { learningLanguage, recentCourseByLanguage } = useLearningLanguage();
  const { fetchSubscription } = useSubscriptionStore();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSubscription(user.uid);
      }
    }, [fetchSubscription, user])
  );

  const handleCourseSelect = (course: Course) => {
    try {
      if (isJlptParentCourseId(course.id)) {
        router.push("/course/jlpt-levels");
        return;
      }

      router.push({
        pathname: "/course/[courseId]/days",
        params: { courseId: course.id },
      });
    } catch (error) {
      console.error("Error navigating to course:", error);
    }
  };

  const recentCourse = recentCourseByLanguage[learningLanguage];
  const recentCourseData = findRuntimeCourse(recentCourse);
  const allCourses = getTopLevelCoursesForLanguage(learningLanguage);
  const otherCourses = allCourses.filter((course) => course.id !== recentCourse);

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VocaHeader />
        {recentCourseData && (
          <RecentCourseSection
            course={recentCourseData}
            onPress={() =>
              isJlptParentCourseId(recentCourseData.id)
                ? router.push("/course/jlpt-levels")
                : router.push({
                    pathname: "/course/[courseId]/days",
                    params: { courseId: recentCourseData.id },
                  })
            }
          />
        )}
        <AllCoursesSection
          courses={recentCourse ? otherCourses : allCourses}
          onCoursePress={handleCourseSelect}
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
