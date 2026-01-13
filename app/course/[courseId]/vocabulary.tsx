import {
    TinderSwipe,
    TinderSwipeRef,
} from "@/src/components/tinder-swipe/TinderSwipe";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SwipeCardItem } from "../../../components/swipe/SwipeCardItem";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { db } from "../../../src/services/firebase";
import { CourseType, VocabularyCard } from "../../../src/types/vocabulary";

const { width, height } = Dimensions.get("window");

// Sample vocabulary data - 10 words per day
const generateDayVocabulary = (
  course: CourseType,
  day: number
): VocabularyCard[] => {
  const baseWords = [
    "Serendipity",
    "Ephemeral",
    "Luminous",
    "Solitude",
    "Aurora",
    "Ethereal",
    "Ineffable",
    "Mellifluous",
    "Ubiquitous",
    "Eloquent",
  ];

  return baseWords.map((word, index) => ({
    id: `${course}-day${day}-${index}`,
    word: `${word} ${day}`,
    pronunciation: "/ˌser.ənˈdɪp.ə.ti/",
    meaning: `Day ${day} - The occurrence and development of events by chance.`,
    example: `This is an example sentence for day ${day}.`,
    image: `https://images.unsplash.com/photo-154948849${index}?w=400`,
    course,
  }));
};

export default function VocabularyScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();
  const router = useRouter();
  const [isFinished, setIsFinished] = useState(false);
  const swipeRef = useRef<TinderSwipeRef>(null);
  const { t } = useTranslation();

  const dayNumber = parseInt(day || "1", 10);
  const data = generateDayVocabulary(courseId as CourseType, dayNumber);
  const [cards, setCards] = useState(data);

  const onSwipeRight = (item: VocabularyCard) => {
    console.log("Learned:", item.word);
  };

  const onSwipeLeft = (item: VocabularyCard) => {
    console.log("Skipped:", item.word);
  };

  const handleFinish = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        [`courseProgress.${courseId}.${dayNumber}`]: {
          completed: true,
          wordsLearned: data.length,
          totalWords: data.length,
          quizCompleted: false,
        },
      });
      router.back();
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleRestart = () => {
    setCards([...data]);
    setIsFinished(false);
  };

  const handleQuiz = () => {
    router.push({
      pathname: "/course/[courseId]/quiz-type",
      params: { courseId, day },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: t("course.dayTitle", { day: dayNumber }),
          headerBackTitle: t("common.back"),
        }}
      />
      <View style={styles.swipeContainer}>
        <View
          style={{
            flex: 1,
            width: "100%",
            display: isFinished ? "none" : "flex",
          }}
        >
          <TinderSwipe
            ref={swipeRef}
            data={cards}
            renderCard={(item) => <SwipeCardItem item={item} />}
            onSwipeRight={onSwipeRight}
            onSwipeLeft={onSwipeLeft}
            loop={false}
            onRunOutOfCards={() => setIsFinished(true)}
          />
        </View>
        {isFinished && (
          <View style={styles.finishedContainer}>
            <Text
              style={[styles.finishedText, { color: isDark ? "#fff" : "#000" }]}
            >
              {t("course.dayCompleted")}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.quizButton]}
                onPress={handleQuiz}
              >
                <Text style={styles.buttonText}>
                  {t("course.takeQuiz")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.restartButton]}
                onPress={handleRestart}
              >
                <Text style={styles.buttonText}>{t("common.review")}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.finishButton]}
              onPress={handleFinish}
            >
              <Text style={styles.buttonText}>{t("common.finish")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeContainer: {
    height: height * 0.7,
    width: width,
    alignItems: "center",
    justifyContent: "center",
  },
  finishedContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  finishedText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quizButton: {
    backgroundColor: "#28a745",
  },
  restartButton: {
    backgroundColor: "#007bff",
  },
  finishButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
