// React and React Native imports
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore database operations
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next"; // Internationalization
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom components
import { FilterChips } from "../../components/common/FilterChips";
import {
  EmptyWordBankView,
  SkeletonList,
  WordList,
} from "../../components/course-wordbank";
import { SavedWord } from "../../components/wordbank/WordCard";

// Context, services, and types
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { COURSES } from "../../src/types/vocabulary";

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
 * - Uses different card types for COLLOCATION vs regular courses
 * - Fetches data from Firestore on screen focus
 * - Shows empty state with call-to-action when no words are saved
 * - Supports internationalization for all text
 *
 * @route /courses/[course]
 * @param course - The course ID from route parameters (e.g., "CSAT", "IELTS", "COLLOCATION")
 */
export default function CourseWordBankScreen() {
  // === Hooks and Context ===

  const { isDark } = useTheme(); // Dark mode state
  const { user } = useAuth(); // Current authenticated user
  const { course } = useLocalSearchParams<{ course: string }>(); // Course ID from URL
  const { t } = useTranslation(); // Translation function for i18n

  // === State Management ===

  const [words, setWords] = useState<SavedWord[]>([]); // Array of saved words for this course
  const [loading, setLoading] = useState(true); // Loading state while fetching data
  const [selectedFilter, setSelectedFilter] = useState("all");

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

  // Filter words based on selection
  const filteredWords = useMemo(() => {
    if (selectedFilter === "all") return words;
    if (selectedFilter.startsWith("day-")) {
      const day = parseInt(selectedFilter.replace("day-", ""), 10);
      return words.filter((w) => w.day === day);
    }
    return words;
  }, [words, selectedFilter]);

  // Find course metadata (color, title, etc.) from course configuration
  const courseData = COURSES.find((c) => c.id === course);
  const isCollocationCourse = course === "COLLOCATION";

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

    setLoading(true);
    try {
      // Fetch the course document from Firestore
      const courseDoc = await getDoc(
        doc(db, "vocabank", user.uid, "course", course),
      );

      // If document exists, set words; otherwise, set empty array
      if (courseDoc.exists()) {
        setWords(courseDoc.data().words || []);
      } else {
        setWords([]);
      }
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  }, [user, course]);

  /**
   * Refetch words whenever the screen comes into focus
   * This ensures the word list is always up-to-date when navigating back
   */
  useFocusEffect(
    useCallback(() => {
      fetchWords();
    }, [fetchWords]),
  );

  // === Event Handlers ===

  /**
   * Handles word deletion from the word bank
   *
   * Process:
   * 1. Show confirmation alert to prevent accidental deletions
   * 2. If confirmed, filter out the word from the local state
   * 3. Update Firestore with the new words array
   * 4. Update local state optimistically for immediate UI feedback
   * 5. Show error alert if deletion fails
   *
   * @param wordId - The unique ID of the word to delete
   */
  const handleDelete = useCallback(
    async (wordId: string) => {
      if (!user) return;

      // Find the word to get its text for the confirmation message
      const wordToDelete = words.find((w) => w.id === wordId);
      if (!wordToDelete) return;

      // Show confirmation dialog
      Alert.alert(
        t("wordBank.delete.title", { defaultValue: "Delete Word" }),
        t("wordBank.delete.message", {
          defaultValue: `Are you sure you want to delete "${wordToDelete.word}"?`,
          word: wordToDelete.word,
        }),
        [
          {
            text: t("common.cancel"),
            style: "cancel",
          },
          {
            text: t("common.delete", { defaultValue: "Delete" }),
            style: "destructive",
            onPress: async () => {
              try {
                // Filter out the deleted word
                const updatedWords = words.filter((w) => w.id !== wordId);

                // Update Firestore with new word list
                const courseRef = doc(
                  db,
                  "vocabank",
                  user.uid,
                  "course",
                  course,
                );
                await setDoc(courseRef, { words: updatedWords });

                // Update local state for immediate UI feedback
                setWords(updatedWords);
              } catch (error) {
                console.error("Error deleting word:", error);
                // Show error message if deletion fails
                Alert.alert(
                  t("common.error", { defaultValue: "Error" }),
                  t("wordBank.delete.error", {
                    defaultValue: "Failed to delete word. Please try again.",
                  }),
                );
              }
            },
          },
        ],
      );
    },
    [user, course, words, t],
  );

  // === Render ===

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
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

      {/* Filter Chips */}
      {words.length > 0 && (
        <View style={styles.filterContainer}>
          <FilterChips
            options={filterOptions}
            selectedId={selectedFilter}
            onSelect={setSelectedFilter}
          />
        </View>
      )}

      {isCollocationCourse ? (
        <View style={styles.pagerContainer}>
          {/* Conditional rendering based on loading and data state */}
          {loading ? (
            <SkeletonList courseId={course} isDark={isDark} count={1} />
          ) : filteredWords.length === 0 ? (
            <EmptyWordBankView
              courseId={course}
              courseColor={courseData?.color}
              isDark={isDark}
            />
          ) : (
            <WordList
              words={filteredWords}
              courseId={course}
              courseColor={courseData?.color}
              isDark={isDark}
              onDelete={handleDelete}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Conditional rendering based on loading and data state */}
          {loading ? (
            <SkeletonList courseId={course} isDark={isDark} count={3} />
          ) : filteredWords.length === 0 ? (
            <EmptyWordBankView
              courseId={course}
              courseColor={courseData?.color}
              isDark={isDark}
            />
          ) : (
            <WordList
              words={filteredWords}
              courseId={course}
              courseColor={courseData?.color}
              isDark={isDark}
              onDelete={handleDelete}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// === Styles ===

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pagerContainer: {
    flex: 1,
    width: "100%",
  },
  filterContainer: {
    paddingVertical: 12,
  },
});
