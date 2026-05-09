import { FontSizes } from "@/constants/fontSizes";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBannerAd } from "../../components/ads/TopBannerAd";
import { JlptLevelList } from "../../components/course/JlptLevelList";
import { ThemedText } from "../../components/themed-text";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { useTheme } from "../../src/context/ThemeContext";
import { StudyModeProvider } from "../../src/hooks/useStudyMode";
import { JLPT_LEVELS, JLPTLevelCourse } from "../../src/types/vocabulary";

export default function WordBankJlptLevelsScreen() {
  return (
    <StudyModeProvider keepAwakeTag="WordBankJlptLevelsScreen">
      <WordBankJlptLevelsScreenContent />
    </StudyModeProvider>
  );
}

function WordBankJlptLevelsScreenContent() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const router = useRouter();
  const { t } = useTranslation();

  const handleLevelPress = (level: JLPTLevelCourse) => {
    router.push({
      pathname: "/courses/[course]",
      params: { course: level.id },
    });
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
          headerShadowVisible: false,
          headerStyle: { backgroundColor: bgColors.screen },
          headerTintColor: isDark ? "#fff" : "#000",
          headerShown: false
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
    marginTop: 16,
    marginBottom: 40,
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
