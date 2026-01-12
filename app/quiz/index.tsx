import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DUMMY_DATA } from "../(tabs)/swipe";
import { VocabularyCard } from "../../components/swipe/SwipeCardItem";
import { useTheme } from "../../src/context/ThemeContext";

type Question = {
  correctCard: VocabularyCard;
  options: VocabularyCard[];
};

export default function QuizScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = () => {
    // Shuffle data and pick 5 questions (or all if less than 5)
    const shuffledData = [...DUMMY_DATA].sort(() => 0.5 - Math.random());
    const selectedWords = shuffledData.slice(0, 10);

    const newQuestions = selectedWords.map((word) => {
      const otherWords = DUMMY_DATA.filter((w) => w.id !== word.id);
      const shuffledOthers = otherWords.sort(() => 0.5 - Math.random());
      const wrongOptions = shuffledOthers.slice(0, 3);
      const options = [word, ...wrongOptions].sort(() => 0.5 - Math.random());

      return {
        correctCard: word,
        options,
      };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOptionId(null);
  };

  const handleOptionPress = (optionId: string) => {
    if (selectedOptionId) return; // Prevent multiple selections

    setSelectedOptionId(optionId);
    const isCorrect = optionId === questions[currentIndex].correctCard.id;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Move to next question after a short delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOptionId(null);
      } else {
        setIsFinished(true);
      }
    }, 1000);
  };

  const handleRestart = () => {
    generateQuestions();
  };

  const handleBack = () => {
    router.back();
  };

  if (questions.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <Stack.Screen options={{ title: "Quiz" }} />
        <Text style={{ color: isDark ? "#fff" : "#000" }}>Loading...</Text>
      </View>
    );
  }

  if (isFinished) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <Stack.Screen options={{ title: "Quiz Results" }} />
        <View style={styles.resultContainer}>
          <Text
            style={[styles.resultTitle, { color: isDark ? "#fff" : "#000" }]}
          >
            Quiz Completed!
          </Text>
          <Text
            style={[styles.resultScore, { color: isDark ? "#ccc" : "#444" }]}
          >
            Your Score: {score} / {questions.length}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={handleRestart}
            >
              <Text style={styles.buttonText}>Restart Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
            >
              <Text style={styles.buttonText}>Back to Deck</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{ title: `Quiz (${currentIndex + 1}/${questions.length})` }}
      />

      <View style={styles.questionContainer}>
        <Text
          style={[styles.questionLabel, { color: isDark ? "#bbb" : "#666" }]}
        >
          What is the word for:
        </Text>
        <View style={styles.definitionCard}>
          <Text style={styles.definitionText}>
            {currentQuestion.correctCard.definition}
          </Text>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option) => {
          let buttonStyle: any = styles.optionButton;
          if (selectedOptionId) {
            if (option.id === currentQuestion.correctCard.id) {
              buttonStyle = styles.correctButton;
            } else if (option.id === selectedOptionId) {
              buttonStyle = styles.wrongButton;
            }
          }

          return (
            <TouchableOpacity
              key={option.id}
              style={[buttonStyle, { borderColor: isDark ? "#333" : "#ddd" }]}
              onPress={() => handleOptionPress(option.id)}
              disabled={!!selectedOptionId}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color:
                      selectedOptionId &&
                      (buttonStyle === styles.correctButton ||
                        buttonStyle === styles.wrongButton)
                        ? "#fff"
                        : isDark
                        ? "#fff"
                        : "#000",
                  },
                ]}
              >
                {option.word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultScore: {
    fontSize: 22,
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  restartButton: {
    backgroundColor: "#007bff",
  },
  backButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  questionContainer: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  definitionCard: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  definitionText: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    color: "#333",
  },
  optionsContainer: {
    flex: 1,
    gap: 15,
  },
  optionButton: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  correctButton: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  wrongButton: {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "500",
  },
});
