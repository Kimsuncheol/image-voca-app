import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { FontSizes } from "@/constants/fontSizes";

import {
  AllCoursesSection,
  RecentCourseSection,
  VocaHeader,
} from "../../components/course";
import { TopBannerAd } from "../../components/ads/TopBannerAd";
import { ThemedText } from "../../components/themed-text";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useTheme } from "../../src/context/ThemeContext";
import { getTotalDaysForCourse } from "../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../src/stores";
import {
  Course,
  CourseType,
  findRuntimeCourse,
  getTopLevelCoursesForLanguage,
  isJlptParentCourseId,
  JLPT_LEVELS,
  RuntimeCourse,
} from "../../src/types/vocabulary";
import {
  isCourseFullyCompleted,
  isJlptParentCompleted,
} from "../../src/utils/courseCompletion";

export default function CourseSelectionScreen() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const { user } = useAuth();
  const { courseProgress, fetchCourseProgress } = useUserStatsStore();
  const { learningLanguage, recentCourseByLanguage } = useLearningLanguage();
  const { t } = useTranslation();
  const [totalDaysByCourse, setTotalDaysByCourse] = React.useState<
    Partial<Record<CourseType, number>>
  >({});

  const handleCourseSelect = (course: Course) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      if (isJlptParentCourseId(course.id)) {
        router.push("/course/jlpt-levels");
      } else {
        router.push({
          pathname: "/course/[courseId]/days",
          params: { courseId: course.id },
        });
      }
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
  const recentCourseData = React.useMemo(
    () => findRuntimeCourse(recentCourse),
    [recentCourse],
  );
  const allCourses = React.useMemo(
    () => getTopLevelCoursesForLanguage(learningLanguage),
    [learningLanguage],
  );
  const otherCourses = React.useMemo(
    () => allCourses.filter((course) => course.id !== recentCourse),
    [allCourses, recentCourse],
  );
  const visibleCourses = React.useMemo(
    () =>
      learningLanguage === "ja"
        ? allCourses
        : recentCourse
          ? otherCourses
          : allCourses,
    [allCourses, learningLanguage, otherCourses, recentCourse],
  );

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const courseIds = new Set<CourseType>();
      const addCompletionCourseIds = (course: RuntimeCourse | undefined) => {
        if (!course) return;
        if (isJlptParentCourseId(course.id)) {
          JLPT_LEVELS.forEach((level) => courseIds.add(level.id));
          return;
        }
        courseIds.add(course.id as CourseType);
      };

      visibleCourses.forEach(addCompletionCourseIds);
      addCompletionCourseIds(recentCourseData);

      if (user) {
        courseIds.forEach((courseId) => {
          void fetchCourseProgress(user.uid, courseId);
        });
      }

      const loadTotals = async () => {
        const entries = await Promise.all(
          Array.from(courseIds).map(
            async (courseId) =>
              [courseId, await getTotalDaysForCourse(courseId)] as const,
          ),
        );

        if (!active) return;

        setTotalDaysByCourse((current) => ({
          ...current,
          ...entries.reduce<Partial<Record<CourseType, number>>>(
            (acc, [courseId, totalDays]) => {
              acc[courseId] = totalDays;
              return acc;
            },
            {},
          ),
        }));
      };

      void loadTotals();

      return () => {
        active = false;
      };
    }, [fetchCourseProgress, recentCourseData, user, visibleCourses]),
  );

  const completedCourseIds = React.useMemo(() => {
    const completed = allCourses.reduce<Partial<Record<CourseType, boolean>>>(
      (acc, course) => {
        if (isJlptParentCourseId(course.id)) {
          const levelCompletionMap = JLPT_LEVELS.reduce<Record<string, boolean>>(
            (levelAcc, level) => {
              levelAcc[level.id] = isCourseFullyCompleted(
                courseProgress[level.id],
                totalDaysByCourse[level.id],
              );
              return levelAcc;
            },
            {},
          );
          acc[course.id] = isJlptParentCompleted(levelCompletionMap);
          return acc;
        }

        acc[course.id] = isCourseFullyCompleted(
          courseProgress[course.id],
          totalDaysByCourse[course.id as CourseType],
        );
        return acc;
      },
      {},
    );

    if (recentCourseData && completed[recentCourseData.id] === undefined) {
      completed[recentCourseData.id] = isCourseFullyCompleted(
        courseProgress[recentCourseData.id],
        totalDaysByCourse[recentCourseData.id],
      );
    }

    return completed;
  }, [allCourses, courseProgress, recentCourseData, totalDaysByCourse]);

  return (
    <View
      style={[styles.container, { backgroundColor: bgColors.screen }]}
    >
      <TopBannerAd includeTopInset={false} />
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
            isCompleted={completedCourseIds[recentCourseData.id] === true}
          />
        )}
        <AllCoursesSection
          courses={visibleCourses}
          onCoursePress={handleCourseSelect}
          completedCourseIds={completedCourseIds}
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
    fontSize: FontSizes.bodyMd,
    fontWeight: FontWeights.medium,
  },
  kanaButtonTextGroup: {
    flex: 1,
    gap: 2,
  },
  kanaButtonSubtitle: {
    fontSize: FontSizes.caption,
    opacity: 0.65,
    lineHeight: LineHeights.bodyMd,
  },
});
