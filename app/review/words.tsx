import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";
import { useTheme } from "../../src/context/ThemeContext";
import { COURSES, CourseType, VocabularyCard } from "../../src/types/vocabulary";

// Generate vocabulary for review
const generateDayVocabulary = (
  course: CourseType,
  day: number
): VocabularyCard[] => {
  const baseWords = [
    { word: "Serendipity", meaning: "Finding something good by chance", pronunciation: "/ˌser.ənˈdɪp.ə.ti/" },
    { word: "Ephemeral", meaning: "Lasting for a very short time", pronunciation: "/ɪˈfem.ər.əl/" },
    { word: "Luminous", meaning: "Full of or shedding light", pronunciation: "/ˈluː.mɪ.nəs/" },
    { word: "Solitude", meaning: "The state of being alone", pronunciation: "/ˈsɒl.ɪ.tjuːd/" },
    { word: "Aurora", meaning: "Natural light display in the sky", pronunciation: "/ɔːˈrɔː.rə/" },
    { word: "Ethereal", meaning: "Extremely delicate and light", pronunciation: "/iˈθɪə.ri.əl/" },
    { word: "Ineffable", meaning: "Too great to be expressed in words", pronunciation: "/ɪnˈef.ə.bəl/" },
    { word: "Mellifluous", meaning: "Sweet or musical; pleasant to hear", pronunciation: "/meˈlɪf.lu.əs/" },
    { word: "Ubiquitous", meaning: "Present everywhere", pronunciation: "/juːˈbɪk.wɪ.təs/" },
    { word: "Eloquent", meaning: "Fluent or persuasive in speaking", pronunciation: "/ˈel.ə.kwənt/" },
  ];

  return baseWords.map((w, index) => ({
    id: `${course}-day${day}-${index}`,
    word: w.word,
    pronunciation: w.pronunciation,
    meaning: w.meaning,
    example: `This is an example sentence using ${w.word.toLowerCase()}.`,
    course,
  }));
};

export default function ReviewWordsScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();

  const course = COURSES.find((c) => c.id === courseId);
  const dayNumber = parseInt(day || "1", 10);
  const words = generateDayVocabulary(courseId as CourseType, dayNumber);

  const speak = (word: string) => {
    Speech.speak(word);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: t("review.dayWordsTitle", { day: dayNumber }),
          headerBackTitle: t("common.back"),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title">
            {t("course.dayTitle", { day: dayNumber })}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("review.wordsToReview", { count: words.length })}
          </ThemedText>
        </View>

        <View style={styles.wordsGrid}>
          {words.map((word, index) => (
            <View
              key={word.id}
              style={[
                styles.wordCard,
                { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
              ]}
            >
              <View style={styles.wordHeader}>
                <View style={styles.wordTitleRow}>
                  <ThemedText type="subtitle" style={styles.wordTitle}>
                    {word.word}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => speak(word.word)}
                    style={styles.speakerButton}
                  >
                    <Ionicons
                      name="volume-medium"
                      size={22}
                      color={course?.color || "#007AFF"}
                    />
                  </TouchableOpacity>
                </View>
                {word.pronunciation && (
                  <ThemedText style={styles.pronunciation}>
                    {word.pronunciation}
                  </ThemedText>
                )}
              </View>
              <ThemedText style={styles.meaning}>{word.meaning}</ThemedText>
              <View style={styles.exampleContainer}>
                <ThemedText style={styles.example}>
                  {`"${word.example}"`}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
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
  wordsGrid: {
    gap: 12,
  },
  wordCard: {
    padding: 16,
    borderRadius: 16,
  },
  wordHeader: {
    marginBottom: 8,
  },
  wordTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wordTitle: {
    fontSize: 20,
  },
  speakerButton: {
    padding: 4,
  },
  pronunciation: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.6,
    marginTop: 2,
  },
  meaning: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  exampleContainer: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    marginTop: 4,
  },
  example: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
  },
});
