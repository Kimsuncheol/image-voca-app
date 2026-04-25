import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopInstallNativeAd } from "../../components/ads/TopInstallNativeAd";
import { JlptLevelList } from "../../components/course/JlptLevelList";
import { ThemedText } from "../../components/themed-text";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { useTheme } from "../../src/context/ThemeContext";
import { getTotalDaysForCourse } from "../../src/services/vocabularyPrefetch";
import { JLPT_LEVELS, JLPTLevelCourse } from "../../src/types/vocabulary";

export default function JlptLevelsScreen() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const router = useRouter();
  const { t } = useTranslation();
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
          headerBackTitle: t("common.back"),
        }}
      />
      <TopInstallNativeAd containerStyle={styles.topInstallAd} />
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
          totalDaysByLevel={totalDaysByLevel}
          onLevelPress={handleLevelPress}
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
    paddingTop: 0,
    paddingBottom: 40,
  },
  topInstallAd: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 24,
    overflow: "hidden",
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 4,
  },
});
