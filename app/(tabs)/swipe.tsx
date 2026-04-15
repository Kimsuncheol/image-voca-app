import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import {
  AllCoursesSection,
  RecentCourseSection,
  VocaHeader,
} from "../../components/course";
import { TopInstallNativeAd } from "../../components/ads/TopInstallNativeAd";
import { ThemedText } from "../../components/themed-text";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  Course,
  findRuntimeCourse,
  getTopLevelCoursesForLanguage,
  isJlptParentCourseId,
} from "../../src/types/vocabulary";

export default function CourseSelectionScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { learningLanguage, recentCourseByLanguage } = useLearningLanguage();
  const { t } = useTranslation();

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
      <TopInstallNativeAd />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VocaHeader />
        {learningLanguage === "ja" && (
          <TouchableOpacity
            style={[
              styles.kanaButton,
              { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
            ]}
            onPress={() => router.push("/elementary-japanese")}
            activeOpacity={0.7}
          >
            <View style={styles.kanaButtonLeft}>
              <Ionicons
                name="school-outline"
                size={22}
                color={isDark ? "#fff" : "#111827"}
              />
              <View style={styles.kanaButtonTextGroup}>
                <ThemedText style={styles.kanaButtonText}>
                  {t("elementaryJapanese.title", {
                    defaultValue: "Elementary Japanese",
                  })}
                </ThemedText>
                <ThemedText style={styles.kanaButtonSubtitle}>
                  {t("elementaryJapanese.subtitle", {
                    defaultValue: "Start with characters and core building blocks",
                  })}
                </ThemedText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
            />
          </TouchableOpacity>
        )}
        {/* RecentCourseSection hidden for Japanese — only one course (JLPT) exists */}
        {learningLanguage !== "ja" && recentCourseData && (
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
          courses={learningLanguage === "ja" ? allCourses : recentCourse ? otherCourses : allCourses}
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
  kanaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  kanaButtonLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  kanaButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  kanaButtonTextGroup: {
    flex: 1,
    gap: 2,
  },
  kanaButtonSubtitle: {
    fontSize: 12,
    opacity: 0.65,
    lineHeight: 16,
  },
});
