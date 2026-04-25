import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
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
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useTheme } from "../../src/context/ThemeContext";
import {
  Course,
  findRuntimeCourse,
  getTopLevelCoursesForLanguage,
  isJlptParentCourseId,
} from "../../src/types/vocabulary";

export default function CourseSelectionScreen() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const { learningLanguage, recentCourseByLanguage } = useLearningLanguage();
  const { t } = useTranslation();

  const handleCourseSelect = (course: Course) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
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
      isNavigatingRef.current = false;
      return;
    }
    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  };

  const handleKanaPress = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push("/elementary-japanese");
    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  };

  const handleRecentCoursePress = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    if (recentCourseData && isJlptParentCourseId(recentCourseData.id)) {
      router.push("/course/jlpt-levels");
    } else if (recentCourseData) {
      router.push({
        pathname: "/course/[courseId]/days",
        params: { courseId: recentCourseData.id },
      });
    }
    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  };

  const recentCourse = recentCourseByLanguage[learningLanguage];
  const recentCourseData = findRuntimeCourse(recentCourse);
  const allCourses = getTopLevelCoursesForLanguage(learningLanguage);
  const otherCourses = allCourses.filter((course) => course.id !== recentCourse);

  return (
    <View
      style={[styles.container, { backgroundColor: bgColors.screen }]}
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
              { backgroundColor: bgColors.cardSubtle },
            ]}
            onPress={handleKanaPress}
            activeOpacity={0.7}
          >
            <View style={styles.kanaButtonLeft}>
              <Ionicons
                name="school-outline"
                size={22}
                color={fontColors.screenTitleStrong}
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
              color={fontColors.iconMutedOverlay}
            />
          </TouchableOpacity>
        )}
        {/* RecentCourseSection hidden for Japanese — only one course (JLPT) exists */}
        {learningLanguage !== "ja" && recentCourseData && (
          <RecentCourseSection
            course={recentCourseData}
            onPress={handleRecentCoursePress}
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
