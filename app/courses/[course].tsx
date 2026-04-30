// React and React Native imports
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore database operations
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next"; // Internationalization
import { Alert, FlatList, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontSizes } from "@/constants/fontSizes";

// Custom components
import { TopInstallNativeAd } from "../../components/ads/TopInstallNativeAd";
import { AppSplashScreen } from "../../components/common/AppSplashScreen";
import { FilterChips } from "../../components/common/FilterChips";
import {
  EmptyWordBankView,
  SwipeToDeleteRow,
} from "../../components/course-wordbank";
import { SavedWord, WordCard } from "../../components/wordbank/WordCard";

// Context, services, and types
import { useAuth } from "../../src/context/AuthContext";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useTheme } from "../../src/context/ThemeContext";
import { useAndroidImmersiveStudyMode } from "../../src/hooks/useAndroidImmersiveStudyMode";
import { db } from "../../src/services/firebase";
import { CourseType, findRuntimeCourse } from "../../src/types/vocabulary";

/**
 * Course Word Bank Screen
 *
 * Displays all saved words for a specific course from the user's word bank.
 * Users can:
 * - View their saved vocabulary words organized by course
 * - Delete words from their collection
 * - Navigate back to the course to learn more words
 *
 * Features:
 * - Renders all saved items in a unified word-card layout
 * - Fetches data from Firestore on screen focus
 * - Shows empty state with call-to-action when no words are saved
 * - Supports internationalization for all text
 *
 * @route /courses/[course]
 * @param course - The course ID from route parameters (e.g., "CSAT", "TOEFL_IELTS", "COLLOCATION")
 */
export default function CourseWordBankScreen() {
  // === Hooks and Context ===

  useAndroidImmersiveStudyMode("CourseWordBankScreen");

  const { isDark } = useTheme(); // Dark mode state
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const { user } = useAuth(); // Current authenticated user
  const { course } = useLocalSearchParams<{ course: CourseType }>(); // Course ID from URL
  const { t } = useTranslation(); // Translation function for i18n

  // === State Management ===

  const [words, setWords] = useState<SavedWord[]>([]); // Array of saved words for this course
  const [loading, setLoading] = useState(true); // Loading state while fetching data + images
  const [splashMounted, setSplashMounted] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const showPronunciation = course !== "COLLOCATION";
  const expandExampleToContent = course === "COLLOCATION";

  // Generate filter options dynamically based on available days
  const filterOptions = useMemo(() => {
    const options = [
      { id: "all", label: t("common.all", { defaultValue: "All" }) },
    ];

    // Extract unique days
    const uniqueDays = Array.from(
      new Set(words.map((w) => w.day).filter(Boolean)),
    ).sort((a, b) => (a || 0) - (b || 0));

    uniqueDays.forEach((day) => {
      options.push({
        id: `day-${day}`,
        label: `${t("common.day", { defaultValue: "Day" })} ${day}`,
      });
    });

    return options;
  }, [words, t]);

  // Filter words based on day selection + search query, sorted by day ascending
  const filteredWords = useMemo(() => {
    const sortByDay = (arr: SavedWord[]) =>
      [...arr].sort((a, b) => (a.day ?? Infinity) - (b.day ?? Infinity));

    let result = words;
    if (selectedFilter.startsWith("day-")) {
      const day = parseInt(selectedFilter.replace("day-", ""), 10);
      result = result.filter((w) => w.day === day);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (w) => {
          const wordText = w.kanji ?? w.word ?? "";
          const meaningText = Array.isArray(w.meaning)
            ? w.meaning.join("; ")
            : (w.meaning ?? "");
          const exampleText = Array.isArray(w.example)
            ? w.example.join("\n")
            : (w.example ?? "");

          return (
            wordText.toLowerCase().includes(q) ||
            meaningText.toLowerCase().includes(q) ||
            exampleText.toLowerCase().includes(q)
          );
        },
      );
    }
    return sortByDay(result);
  }, [words, selectedFilter, searchQuery]);

  // Find course metadata (color, title, etc.) from course configuration
  const courseData = findRuntimeCourse(course);

  // === Data Fetching ===

  /**
   * Fetches saved words for the current course from Firestore
   *
   * Data structure in Firestore:
   * /vocabank/{userId}/course/{courseId}
   * - words: Array of SavedWord objects
   *
   * Each SavedWord contains:
   * - id: Unique identifier
   * - word: The vocabulary word or collocation
   * - meaning: Definition
   * - pronunciation: Phonetic transcription (or explanation for collocations)
   * - example: Example sentence
   * - translation: Optional translation
   * - course: Course ID
   * - day: Optional day number
   * - addedAt: Timestamp when word was saved
   */
  const fetchWords = useCallback(async () => {
    if (!user || !course) return;

    setSplashMounted(true);
    setLoading(true);
    try {
      // Fetch the course document from Firestore
      const courseDoc = await getDoc(
        doc(db, "vocabank", user.uid, "course", course),
      );

      let fetchedWords: SavedWord[] = [];
      // If document exists, set words; otherwise, set empty array
      if (courseDoc.exists()) {
        fetchedWords = courseDoc.data().words || [];
        setWords(fetchedWords);
      } else {
        setWords([]);
      }

      // Prefetch images so loading screen stays until images are ready
      const imageUrls = fetchedWords
        .map((w) => w.imageUrl)
        .filter(Boolean) as string[];
      if (imageUrls.length > 0) {
        await Promise.allSettled(imageUrls.map((url) => Image.prefetch(url)));
      }
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  }, [user, course]);

  /**
   * Refetch words whenever the screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      fetchWords();
    }, [fetchWords]),
  );

  // === Event Handlers ===

  const handleDeleteWord = useCallback(
    async (wordId: string) => {
      if (!user || !course) {
        return;
      }

      try {
        const updatedWords = words.filter((word) => word.id !== wordId);
        const courseRef = doc(db, "vocabank", user.uid, "course", course);
        await setDoc(courseRef, { words: updatedWords });
        setWords(updatedWords);
      } catch (error) {
        console.error("Error deleting word:", error);
        Alert.alert(
          t("common.error", { defaultValue: "Error" }),
          t("wordBank.delete.error", {
            defaultValue: "Failed to delete word. Please try again.",
          }),
        );
      }
    },
    [course, t, user, words],
  );

  // === Render ===

  const listHeader =
    words.length > 0 ? (
      <View style={styles.listHeader}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: bgColors.cardSubtle,
              color: fontColors.screenTitleStrong,
            },
          ]}
          placeholder={t("wordBank.searchPlaceholder")}
          placeholderTextColor={fontColors.inputPlaceholderDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <FilterChips
          options={filterOptions}
          selectedId={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>
    ) : null;

  return (
    <SafeAreaView
      // header

      style={[styles.container, { backgroundColor: bgColors.screen }]}
      edges={["left", "right", "bottom"]}
    >
      {/* Configure navigation header */}
      <Stack.Screen
        options={{
          title: courseData
            ? t(courseData.titleKey, { defaultValue: courseData.title })
            : t("wordBank.title"),
          headerBackTitle: t("common.back"),
          headerShown: false,
        }}
      />

      {!loading && (
        <>
          {words.length > 0 ? (
            <TopInstallNativeAd containerStyle={styles.topInstallAd} />
          ) : null}
          <FlatList
            data={filteredWords}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SwipeToDeleteRow
                itemId={item.id}
                isDark={isDark}
                onDelete={handleDeleteWord}
              >
                <WordCard
                  word={item}
                  courseColor={courseData?.color}
                  isDark={isDark}
                  showPronunciation={showPronunciation}
                  expandExampleToContent={expandExampleToContent}
                />
              </SwipeToDeleteRow>
            )}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <EmptyWordBankView
                courseId={course}
                courseColor={courseData?.color}
                isDark={isDark}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {splashMounted && (
        <AppSplashScreen
          visible={loading}
          onHidden={() => setSplashMounted(false)}
        />
      )}
    </SafeAreaView>
  );
}

// === Styles ===

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topInstallAd: {
    marginBottom: -4,
    overflow: "hidden",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FontSizes.bodyMd,
    marginBottom: 12,
  },
});
