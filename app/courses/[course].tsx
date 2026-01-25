import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CollocationFlipCard } from "../../components/CollocationFlipCard";
import { ThemedText } from "../../components/themed-text";
import { SavedWord, WordCard } from "../../components/wordbank/WordCard";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { COURSES } from "../../src/types/vocabulary";

const COLLOCATION_DATA = [
  {
    collocation: "make a decision",
    meaning: "decide something",
    explanation: "Used when you choose one option",
    example: "I had to make a decision quickly",
    translation: "결정을 내리다",
  },
  {
    collocation: "do a favor",
    meaning: "help someone",
    explanation: "Used when you help someone",
    example: "Can you do me a favor?",
    translation: "부탁을 들어주다",
  },
  {
    collocation: "make a mistake",
    meaning: "do something wrong",
    explanation: "Used when you do something incorrect",
    example: "I made a mistake on the test.",
    translation: "실수를 하다",
  },
];

export default function CourseWordBankScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
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
        doc(db, "vocabank", user.uid, "course", course),
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
    }, [fetchWords]),
  );

  const handleDelete = useCallback(
    async (wordId: string) => {
      if (!user) return;

      const wordToDelete = words.find((w) => w.id === wordId);
      if (!wordToDelete) return;

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
                const updatedWords = words.filter((w) => w.id !== wordId);
                const courseRef = doc(
                  db,
                  "vocabank",
                  user.uid,
                  "course",
                  course,
                );
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
          },
        ],
      );
    },
    [user, course, words, t],
  );

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
        ) : course === "COLLOCATION" ? (
          COLLOCATION_DATA.map((item, index) => (
            <CollocationFlipCard key={index} data={item} isDark={isDark} />
          ))
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
            <Pressable
              style={[
                styles.startButton,
                { backgroundColor: courseData?.color || "#007AFF" },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/course/[courseId]/days",
                  params: { courseId: course },
                })
              }
            >
              <ThemedText style={styles.startButtonText}>
                {t("course.startLearning", { defaultValue: "Start Learning" })}
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          words.map((word, index) => (
            <WordCard
              key={word.id + index}
              word={word}
              courseColor={courseData?.color}
              isDark={isDark}
              onDelete={handleDelete}
            />
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
  startButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
