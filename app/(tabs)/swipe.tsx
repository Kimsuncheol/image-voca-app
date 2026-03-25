import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import {
  AllCoursesSection,
  RecentCourseSection,
  VocaHeader,
} from "../../components/course";
import { ThemedText } from "../../components/themed-text";
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
  const { t } = useTranslation();

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
        {learningLanguage === "ja" && (
          <TouchableOpacity
            style={[
              styles.kanaButton,
              { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
            ]}
            onPress={() => router.push("/japanese-characters")}
            activeOpacity={0.7}
          >
            <View style={styles.kanaButtonLeft}>
              <Ionicons
                name="language-outline"
                size={22}
                color={isDark ? "#fff" : "#111827"}
              />
              <ThemedText style={styles.kanaButtonText}>
                {t("kana.title", { defaultValue: "Hiragana & Katakana" })}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
            />
          </TouchableOpacity>
        )}
        {learningLanguage === "ja" && (
          <TouchableOpacity
            style={[
              styles.kanaButton,
              { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
            ]}
            onPress={() => router.push("/prefix-postfix" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.kanaButtonLeft}>
              <Ionicons
                name="text-outline"
                size={22}
                color={isDark ? "#fff" : "#111827"}
              />
              <ThemedText style={styles.kanaButtonText}>
                {t("prefixPostfix.title", { defaultValue: "Prefix & Postfix" })}
              </ThemedText>
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
    alignItems: "center",
    gap: 10,
  },
  kanaButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
