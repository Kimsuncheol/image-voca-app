import { FontSizes } from "@/constants/fontSizes";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBannerAd } from "../../components/ads/TopBannerAd";
import { JlptLevelList } from "../../components/course/JlptLevelList";
import { ThemedText } from "../../components/themed-text";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getTotalDaysForCourse } from "../../src/services/vocabularyPrefetch";
import { useUserStatsStore } from "../../src/stores";
import { JLPT_LEVELS, JLPTLevelCourse } from "../../src/types/vocabulary";
import { isCourseFullyCompleted } from "../../src/utils/courseCompletion";

export default function JlptLevelsScreen() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { courseProgress, fetchCourseProgress } = useUserStatsStore();
  const [totalDaysByLevel, setTotalDaysByLevel] = useState<
    Partial<Record<JLPTLevelCourse["id"], number>>
  >({});

  useEffect(() => {
    let active = true;

    const loadTotals = async () => {
      const entries = await Promise.all(
        JLPT_LEVELS.map(
          async (level) =>
            [level.id, await getTotalDaysForCourse(level.id)] as const,
        ),
      );

      if (!active) return;

      setTotalDaysByLevel(
        entries.reduce<Partial<Record<JLPTLevelCourse["id"], number>>>(
          (acc, [levelId, totalDays]) => {
            acc[levelId] = totalDays;
            return acc;
          },
          {},
        ),
      );
    };

    void loadTotals();

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;

      JLPT_LEVELS.forEach((level) => {
        void fetchCourseProgress(user.uid, level.id);
      });
    }, [fetchCourseProgress, user]),
  );

  const completedLevelIds = React.useMemo(
    () =>
      JLPT_LEVELS.reduce<Partial<Record<JLPTLevelCourse["id"], boolean>>>(
        (acc, level) => {
          acc[level.id] = isCourseFullyCompleted(
            courseProgress[level.id],
            totalDaysByLevel[level.id],
          );
          return acc;
        },
        {},
      ),
    [courseProgress, totalDaysByLevel],
  );

  const handleLevelPress = (level: JLPTLevelCourse) => {
    try {
      router.push({
        pathname: "/course/[courseId]/days",
        params: {
          courseId: level.id,
          initialTotalDays: totalDaysByLevel[level.id]?.toString(),
        },
      });
    } catch (error) {
      console.error("Error selecting JLPT level:", error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColors.screen }]}
      edges={["left", "right", "bottom"]}
    >
      <Stack.Screen
        options={{
          title: t("courses.jlpt.levels.title"),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bgColors.screen },
          headerTintColor: isDark ? "#fff" : "#000",
          headerBackTitle: t("common.back"),
        }}
      />
      <TopBannerAd includeTopInset={false} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title">{t("courses.jlpt.levels.title")}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("courses.jlpt.levels.subtitle")}
          </ThemedText>
        </View>

        <JlptLevelList
          levels={JLPT_LEVELS}
          onLevelPress={handleLevelPress}
          completedLevelIds={completedLevelIds}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: FontSizes.bodyLg,
    opacity: 0.6,
    marginTop: 4,
  },
});
