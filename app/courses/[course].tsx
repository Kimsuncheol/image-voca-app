// React and React Native imports
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore database operations
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next"; // Internationalization
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
 * - Renders all saved items in a unified word-card layout
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
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Filter words based on selection, sorted by day ascending
  const filteredWords = useMemo(() => {
    const sortByDay = (arr: SavedWord[]) =>
      [...arr].sort((a, b) => (a.day ?? Infinity) - (b.day ?? Infinity));

    if (selectedFilter === "all") return sortByDay(words);
    if (selectedFilter.startsWith("day-")) {
      const day = parseInt(selectedFilter.replace("day-", ""), 10);
      return sortByDay(words.filter((w) => w.day === day));
    }
    return sortByDay(words);
  }, [words, selectedFilter]);

  // Find course metadata (color, title, etc.) from course configuration
  const courseData = COURSES.find((c) => c.id === course);

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
   */
  useFocusEffect(
    useCallback(() => {
      fetchWords();
    }, [fetchWords]),
  );

  React.useEffect(() => {
    setSelectedIds((previous) => {
      const validIds = new Set(words.map((word) => word.id));
      const nextIds = Array.from(previous).filter((id) => validIds.has(id));

      if (
        nextIds.length === previous.size &&
        nextIds.every((id) => previous.has(id))
      ) {
        return previous;
      }

      return new Set(nextIds);
    });
  }, [words]);

  // === Event Handlers ===

  const handleStartDeleteMode = useCallback((wordId: string) => {
    setIsDeleteMode(true);
    setSelectedIds((previous) => {
      const next = new Set(previous);
      next.add(wordId);
      return next;
    });
  }, []);

  const handleToggleSelection = useCallback((wordId: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }, []);

  const handleCancelDeleteMode = useCallback(() => {
    setIsDeleteMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleConfirmDeleteSelection = useCallback(async () => {
    if (!user || !course || selectedIds.size === 0) {
      return;
    }

    setIsDeleting(true);
    try {
      const updatedWords = words.filter((word) => !selectedIds.has(word.id));
      const courseRef = doc(db, "vocabank", user.uid, "course", course);
      await setDoc(courseRef, { words: updatedWords });
      setWords(updatedWords);
      setSelectedIds(new Set());
      setIsDeleteMode(false);
    } catch (error) {
      console.error("Error deleting selected words:", error);
      Alert.alert(
        t("common.error", { defaultValue: "Error" }),
        t("wordBank.delete.error", {
          defaultValue: "Failed to delete word. Please try again.",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  }, [course, selectedIds, t, user, words]);

  const handleDeleteSelected = useCallback(() => {
    const selectedCount = selectedIds.size;
    if (selectedCount === 0) {
      return;
    }

    Alert.alert(
      t("wordBank.delete.title", { defaultValue: "Delete Words" }),
      t("wordBank.delete.bulkMessage", {
        defaultValue:
          selectedCount === 1
            ? "Delete the selected word?"
            : `Delete ${selectedCount} selected items?`,
        count: selectedCount,
      }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete", { defaultValue: "Delete" }),
          style: "destructive",
          onPress: () => {
            void handleConfirmDeleteSelection();
          },
        },
      ],
    );
  }, [handleConfirmDeleteSelection, selectedIds.size, t]);

  // === Render ===

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDeleteMode && styles.scrollContentDeleteMode,
        ]}
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
            isDeleteMode={isDeleteMode}
            selectedIds={selectedIds}
            onStartDeleteMode={handleStartDeleteMode}
            onToggleSelection={handleToggleSelection}
          />
        )}
      </ScrollView>

      {isDeleteMode ? (
        <View
          style={[
            styles.deleteBar,
            { backgroundColor: isDark ? "#111214" : "#FFFFFF" },
          ]}
        >
          <Text style={[styles.deleteBarText, { color: isDark ? "#fff" : "#111" }]}>
            {t("wordBank.delete.selectedCount", {
              defaultValue:
                selectedIds.size === 1
                  ? "1 item selected"
                  : `${selectedIds.size} items selected`,
              count: selectedIds.size,
            })}
          </Text>
          <View style={styles.deleteBarActions}>
            <TouchableOpacity
              onPress={handleCancelDeleteMode}
              disabled={isDeleting}
              style={[
                styles.deleteBarButton,
                styles.cancelButton,
                isDeleting && styles.actionButtonDisabled,
              ]}
            >
              <Text style={styles.cancelButtonText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteSelected}
              disabled={selectedIds.size === 0 || isDeleting}
              style={[
                styles.deleteBarButton,
                styles.deleteButton,
                (selectedIds.size === 0 || isDeleting) && styles.actionButtonDisabled,
              ]}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting
                  ? t("common.loading", { defaultValue: "Deleting..." })
                  : t("common.delete", { defaultValue: "Delete" })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
  scrollContentDeleteMode: {
    paddingBottom: 120,
  },
  filterContainer: {
    paddingVertical: 12,
  },
  deleteBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(127,127,127,0.2)",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 12,
  },
  deleteBarText: {
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBarActions: {
    flexDirection: "row",
    gap: 12,
  },
  deleteBarButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: "#E9E9EB",
  },
  cancelButtonText: {
    color: "#111",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});
