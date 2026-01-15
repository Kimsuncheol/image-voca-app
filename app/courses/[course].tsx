import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../components/themed-text";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { COURSES, CourseType } from "../../src/types/vocabulary";

interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  course: CourseType;
  addedAt: string;
}

export default function CourseWordBankScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { course } = useLocalSearchParams<{ course: string }>();
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const courseData = COURSES.find((c) => c.id === course);

  const fetchWords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const courseDoc = await getDoc(
        doc(db, "vocabank", user.uid, "course", course)
      );
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

  useFocusEffect(
    useCallback(() => {
      fetchWords();
    }, [fetchWords])
  );

  const speak = (word: string) => {
    Speech.speak(word);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: courseData
            ? t(courseData.titleKey, { defaultValue: courseData.title })
            : t("wordBank.title"),
          headerBackTitle: t("common.back"),
          headerShown: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : words.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={64}
              color={isDark ? "#444" : "#ccc"}
            />
            <ThemedText style={styles.emptyText}>
              {t("wordBank.empty.title")}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {t("wordBank.empty.subtitle")}
            </ThemedText>
          </View>
        ) : (
          words.map((word, index) => (
            <View
              key={word.id + index}
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
                      color={courseData?.color || "#007AFF"}
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
          ))
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  wordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
    fontSize: 22,
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
