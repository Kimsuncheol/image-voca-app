import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { FontSizes } from "@/constants/fontSizes";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopInstallNativeAd } from "../../../components/ads/TopInstallNativeAd";
import { AppSplashScreen } from "../../../components/common/AppSplashScreen";
import { DayGrid, EmptyDayView } from "../../../components/course";
import { ThemedText } from "../../../components/themed-text";
import { useAuth } from "../../../src/context/AuthContext";
import { useLearningLanguage } from "../../../src/context/LearningLanguageContext";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  getTotalDaysForCourse,
  prefetchVocabularyCards,
} from "../../../src/services/vocabularyPrefetch";
import {
  DayProgress,
  useSubscriptionStore,
  useUserStatsStore,
} from "../../../src/stores";
import {
  CourseType,
  findRuntimeCourse,
  getLearningLanguageForCourse,
  TopLevelCourseType,
} from "../../../src/types/vocabulary";

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------
// DayProgress, CourseProgress imported from store

const PREVIEWABLE_COURSES = new Set<TopLevelCourseType>([
  "수능",
  "CSAT_IDIOMS",
  "TOEIC",
  "TOEFL_IELTS",
  "EXTREMELY_ADVANCED",
  "COLLOCATION",
]);

/**
 * DayPickerScreen Component
 *
 * Displays the grid of days for a specific course.
 *
 * Key Features:
 * - Load and display progress for each day (learned status, quiz status).
 * - Manage access control based on user subscription (Free vs Premium).
 * - Handle navigation to learning (Vocabulary) or testing (Quiz).
 */
export default function DayPickerScreen() {
  // ---------------------------------------------------------------------------
  // Hooks & Context
  // ---------------------------------------------------------------------------
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const { user } = useAuth();
  const router = useRouter();
  const isFocusedRef = React.useRef(true);
  const isNavigatingRef = React.useRef(false);
  const { t } = useTranslation();
  const { recentCourseByLanguage, setRecentCourseForLanguage } =
    useLearningLanguage();

  // Route params: Identify which course we are viewing
  const { courseId, initialTotalDays } = useLocalSearchParams<{
    courseId: CourseType;
    initialTotalDays?: string;
  }>();

  // Stores: Access stats and subscription logic
  const { courseProgress, fetchCourseProgress } = useUserStatsStore();
  const { fetchSubscription } = useSubscriptionStore();

  // ---------------------------------------------------------------------------
  // Derived State & Constants
  // ---------------------------------------------------------------------------
  const course = useMemo(() => findRuntimeCourse(courseId), [courseId]);
  const courseLanguage = useMemo(
    () => getLearningLanguageForCourse(courseId),
    [courseId],
  );
  const [totalDays, setTotalDays] = useState(() => {
    const parsed = initialTotalDays ? parseInt(initialTotalDays, 10) : NaN;
    return isNaN(parsed) ? 0 : parsed;
  });
  const [loadingDay, setLoadingDay] = useState<number | null>(null);
  const [previewPickerVisible, setPreviewPickerVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(
    !initialTotalDays || isNaN(parseInt(initialTotalDays, 10)),
  );
  const [splashVisible, setSplashVisible] = useState(
    !initialTotalDays || isNaN(parseInt(initialTotalDays, 10)),
  );
  // Progress data for this specific course
  const dayProgress: Record<number, DayProgress> = useMemo(() => {
    if (!courseId) return {};
    return courseProgress[courseId] || {};
  }, [courseId, courseProgress]);

  // First day that hasn't been completed yet
  const firstIncompleteDay = useMemo(() => {
    for (let day = 1; day <= totalDays; day++) {
      if (!dayProgress[day]?.completed) return day;
    }
    return totalDays;
  }, [dayProgress, totalDays]);
  const canPreviewCourse = PREVIEWABLE_COURSES.has(courseId as TopLevelCourseType);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  /**
   * Refetch subscription and progress whenever the screen gains focus.
   * This ensures the UI reflects the latest access state immediately.
   */
  useFocusEffect(
    useCallback(() => {
      if (
        !course ||
        !courseId ||
        !courseLanguage ||
        recentCourseByLanguage[courseLanguage] === courseId
      ) {
        return;
      }

      void setRecentCourseForLanguage(courseLanguage, courseId).catch(
        (error) => {
          console.error("Failed to persist recent course:", error);
        },
      );
    }, [
      course,
      courseId,
      courseLanguage,
      recentCourseByLanguage,
      setRecentCourseForLanguage,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!user || !courseId) return;

      fetchSubscription(user.uid);
      fetchCourseProgress(user.uid, courseId);
    }, [user, courseId, fetchSubscription, fetchCourseProgress]),
  );

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!courseId) return;

    let isActive = true;
    const loadTotalDays = async () => {
      try {
        // Fetch totalDays from course metadata
        const days = await getTotalDaysForCourse(courseId);

        if (isActive) {
          setTotalDays(days);
          setInitialLoading(false);
        }

        console.log(
          "[Days] courseId:",
          courseId,
          "totalDays from metadata:",
          days,
        );
      } catch (error) {
        console.error("[Days] Failed to load day count:", error);
        if (isActive) {
          setInitialLoading(false);
        }
      }
    };

    loadTotalDays();

    return () => {
      isActive = false;
    };
  }, [courseId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  /**
   * Handle tapping on a specific day card.
   * Checks for sequential progression and subscription status.
   */
  const handleDayPress = useCallback(
    async (day: number) => {
      if (!courseId) return;
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      // Check 1: Sequential Progression - Must complete previous day first
      if (day > 1) {
        const previousDay = day - 1;
        const previousDayProgress = dayProgress[previousDay];

        if (!previousDayProgress?.completed) {
          isNavigatingRef.current = false;
          Alert.alert(
            t("course.lockedDay.title", { defaultValue: "Day Locked" }),
            t("course.lockedDay.message", {
              defaultValue: `Please complete Day ${previousDay} first to unlock Day ${day}.`,
              previousDay,
              currentDay: day,
            }),
            [{ text: t("common.ok", { defaultValue: "OK" }), style: "cancel" }],
          );
          return;
        }
      }

      // Access Granted: Prefetch cards + images, then navigate
      setLoadingDay(day);
      const PREFETCH_TIMEOUT_MS = 8000;
      try {
        const cards = await Promise.race([
          prefetchVocabularyCards(courseId as CourseType, day),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("prefetch timeout")),
              PREFETCH_TIMEOUT_MS,
            ),
          ),
        ]);
        const imageUrls = cards
          .map((c) => ("imageUrl" in c ? c.imageUrl : undefined))
          .filter((url): url is string => Boolean(url));
        if (imageUrls.length > 0) {
          await Image.prefetch(imageUrls, "memory-disk").catch(() => {});
        }
      } catch {
        // On timeout or error, navigate anyway — vocabulary screen handles its own loading
      } finally {
        setLoadingDay(null);
      }
      isNavigatingRef.current = false;
      if (!isFocusedRef.current) return;
      router.push({
        pathname: "/course/[courseId]/vocabulary",
        params: { courseId, day: day.toString() },
      });
    },
    [courseId, dayProgress, router, t],
  );

  /**
   * Handle tapping the Quiz button on a day card.
   * Navigates to the Quiz Type selection screen.
   */
  const handleQuizPress = useCallback(
    (day: number) => {
      if (!courseId) return;
      router.push({
        pathname: "/course/[courseId]/quiz-type",
        params: { courseId, day: day.toString() },
      });
    },
    [courseId, router],
  );

  const prefetchDayAssets = useCallback(
    async (day: number) => {
      if (!courseId) return;

      const PREFETCH_TIMEOUT_MS = 8000;
      const cards = await Promise.race([
        prefetchVocabularyCards(courseId as CourseType, day),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("prefetch timeout")),
            PREFETCH_TIMEOUT_MS,
          ),
        ),
      ]);
      const imageUrls = cards
        .map((c) => ("imageUrl" in c ? c.imageUrl : undefined))
        .filter((url): url is string => Boolean(url));
      if (imageUrls.length > 0) {
        await Image.prefetch(imageUrls, "memory-disk").catch(() => {});
      }
    },
    [courseId],
  );

  const handlePreviewDayPress = useCallback(
    async (day: number) => {
      if (!courseId) return;
      setPreviewPickerVisible(false);
      setLoadingDay(day);
      try {
        await prefetchDayAssets(day);
      } catch {
        // Preview screen handles its own loading if prefetch fails or times out.
      } finally {
        setLoadingDay(null);
      }
      if (!isFocusedRef.current) return;
      router.push({
        pathname: "/course/[courseId]/vocabulary",
        params: { courseId, day: day.toString(), preview: "1" },
      });
    },
    [courseId, prefetchDayAssets, router],
  );



  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColors.screen }]}
      edges={["left", "right", "bottom"]}
    >
      <Stack.Screen
        options={{
          headerShown: loadingDay === null && totalDays > 0,
          title:
            loadingDay !== null
              ? ""
              : course
                ? t(course.titleKey, { defaultValue: course.title })
                : t("course.days"),
          headerBackTitle: t("common.back"),
          headerBackVisible: loadingDay === null ? true : false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bgColors.screen },
          headerTintColor: isDark ? "#fff" : "#000",
        }}
      />
      <TopInstallNativeAd />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Continue banner — shown when the user has prior progress */}
        {canPreviewCourse && totalDays > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("course.preview", { defaultValue: "Preview" })}
            style={[
              styles.previewBanner,
              {
                backgroundColor: bgColors.cardSubtle,
                borderColor: course?.color ?? "#007AFF",
              },
            ]}
            onPress={() => setPreviewPickerVisible(true)}
            disabled={loadingDay !== null}
            activeOpacity={0.75}
          >
            <View style={styles.previewBannerLeft}>
              <Ionicons
                name="eye-outline"
                size={22}
                color={course?.color ?? "#007AFF"}
              />
              <View style={styles.previewBannerCopy}>
                <ThemedText style={styles.previewBannerTitle}>
                  {t("course.preview", { defaultValue: "Preview" })}
                </ThemedText>
                <ThemedText style={styles.previewBannerSubtitle}>
                  {t("course.previewSelectDay", {
                    defaultValue: "Select a day to preview",
                  })}
                </ThemedText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={course?.color ?? "#007AFF"}
            />
          </TouchableOpacity>
        )}

        {firstIncompleteDay > 1 && (
          <TouchableOpacity
            style={[
              styles.continueBanner,
              {
                backgroundColor: (course?.color ?? "#007AFF") + "18",
                borderColor: course?.color ?? "#007AFF",
              },
            ]}
            onPress={() => handleDayPress(firstIncompleteDay)}
            disabled={loadingDay !== null}
            activeOpacity={0.75}
          >
            <View style={styles.continueBannerLeft}>
              <ThemedText
                style={[
                  styles.continueBannerLabel,
                  { color: course?.color ?? "#007AFF" },
                ]}
              >
                {t("course.continueFrom", { defaultValue: "Continue" })}
              </ThemedText>
              <ThemedText style={styles.continueBannerDay}>
                {t("course.dayTitle", { day: firstIncompleteDay })}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={course?.color ?? "#007AFF"}
            />
          </TouchableOpacity>
        )}

        {/* Main Grid: Days 1-N */}
        {totalDays === 0 ? (
          <EmptyDayView />
        ) : (
          <DayGrid
            totalDays={totalDays}
            dayProgress={dayProgress}
            courseColor={course?.color}
            courseId={courseId!}
            onDayPress={handleDayPress}
            onQuizPress={handleQuizPress}
          />
        )}
      </ScrollView>

      {loadingDay !== null && (
        <AppSplashScreen visible={true} onHidden={() => {}} />
      )}
      {splashVisible && (
        <AppSplashScreen
          visible={initialLoading}
          onHidden={() => setSplashVisible(false)}
        />
      )}
      <Modal
        visible={previewPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.previewSheet,
              { backgroundColor: bgColors.cardSubtle },
            ]}
          >
            <View style={styles.previewSheetHeader}>
              <ThemedText style={styles.previewSheetTitle}>
                {t("course.previewSelectDay", {
                  defaultValue: "Select a day to preview",
                })}
              </ThemedText>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("common.cancel", {
                  defaultValue: "Cancel",
                })}
                onPress={() => setPreviewPickerVisible(false)}
                style={styles.previewCloseButton}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? "#fff" : "#111"}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.previewDayGrid}
              showsVerticalScrollIndicator={false}
            >
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                <TouchableOpacity
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`${t("course.preview", {
                    defaultValue: "Preview",
                  })} ${t("course.dayTitle", { day })}`}
                  style={[
                    styles.previewDayButton,
                    {
                      borderColor: course?.color ?? "#007AFF",
                      backgroundColor: isDark ? "#1c1c1e" : "#fff",
                    },
                  ]}
                  onPress={() => handlePreviewDayPress(day)}
                >
                  <ThemedText style={styles.previewDayText}>
                    {t("course.dayTitle", { day })}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  continueBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  previewBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  previewBannerCopy: {
    flex: 1,
    gap: 2,
  },
  previewBannerTitle: {
    fontSize: FontSizes.bodyLg,
    fontWeight: "700",
  },
  previewBannerSubtitle: {
    fontSize: FontSizes.caption,
    opacity: 0.65,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  previewSheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  previewSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  previewSheetTitle: {
    fontSize: FontSizes.title,
    fontWeight: "700",
  },
  previewCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  previewDayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 8,
  },
  previewDayButton: {
    width: "30%",
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  previewDayText: {
    fontSize: FontSizes.bodyMd,
    fontWeight: "700",
  },
  continueBannerLeft: {
    gap: 2,
  },
  continueBannerLabel: {
    fontSize: FontSizes.caption,
    fontWeight: "600",
    opacity: 0.8,
  },
  continueBannerDay: {
    fontSize: FontSizes.title,
    fontWeight: "700",
  },
});
