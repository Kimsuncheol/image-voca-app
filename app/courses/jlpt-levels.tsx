import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JlptLevelList } from "../../components/course/JlptLevelList";
import { ThemedText } from "../../components/themed-text";
import { useTheme } from "../../src/context/ThemeContext";
import { JLPT_LEVELS, JLPTLevelCourse } from "../../src/types/vocabulary";

export default function WordBankJlptLevelsScreen() {
  const { isDark } = useTheme();
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
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["left", "right", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
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
          totalDaysByLevel={{}}
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
    padding: 20,
    paddingBottom: 40,
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
