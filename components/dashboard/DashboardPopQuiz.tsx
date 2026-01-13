import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

export function DashboardPopQuiz() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const popWordData = useMemo(() => {
    const words = [
      { word: "Serendipity", meaning: "Finding something good by chance" },
      { word: "Ephemeral", meaning: "Lasting for a very short time" },
      { word: "Luminous", meaning: "Full of or shedding light" },
      { word: "Solitude", meaning: "The state of being alone" },
      { word: "Aurora", meaning: "Natural light display in the sky" },
    ];
    const index = new Date().getDate() % words.length;
    return words[index];
  }, []);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const popOptions = useMemo(() => {
    const options = [
      popWordData.meaning,
      "A type of food",
      "A musical instrument",
      "A weather phenomenon",
    ];
    for (let i = options.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }, [popWordData]);

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.popQuiz.title")}
      </ThemedText>
      <View
        style={[
          styles.popQuizCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <View style={styles.popQuizHeader}>
          <View>
            <ThemedText type="subtitle" style={styles.popQuizTitle}>
              {t("dashboard.popQuiz.headline")}
            </ThemedText>
            <ThemedText style={styles.popQuizSubtitle}>
              {t("dashboard.popQuiz.subtitle")}
            </ThemedText>
          </View>
        </View>

        <View style={styles.popQuizQuestion}>
          <ThemedText style={styles.popQuizQuestionLabel}>
            {t("dashboard.popQuiz.question")}
          </ThemedText>
          <ThemedText style={styles.popQuizQuestionText}>
            {popWordData.word}
          </ThemedText>
        </View>

        <View style={styles.popQuizOptions}>
          {popOptions.map((option) => {
            const selected = selectedOption === option;
            const correct = option === popWordData.meaning;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.popQuizOption,
                  { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                  selected &&
                    (correct
                      ? styles.popQuizOptionCorrect
                      : styles.popQuizOptionIncorrect),
                ]}
                onPress={() => {
                  if (selectedOption) return;
                  setSelectedOption(option);
                  setIsCorrect(option === popWordData.meaning);
                }}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.popQuizOptionText}>
                  {option}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        {isCorrect !== null && (
          <ThemedText
            style={[
              styles.popQuizFeedback,
              { color: isCorrect ? "#28a745" : "#dc3545" },
            ]}
          >
            {isCorrect
              ? t("dashboard.popQuiz.correct")
              : t("dashboard.popQuiz.incorrect")}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  popQuizCard: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  popQuizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  popQuizTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  popQuizSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  popWordBadge: {
    backgroundColor: "#ffedcc",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  popWordLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    opacity: 0.7,
    marginBottom: 2,
  },
  popWordText: {
    fontSize: 18,
    fontWeight: "700",
  },
  popQuizQuestion: {
    gap: 4,
  },
  popQuizQuestionLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  popQuizQuestionText: {
    fontSize: 20,
    fontWeight: "700",
  },
  popQuizOptions: {
    gap: 8,
  },
  popQuizOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  popQuizOptionText: {
    fontSize: 14,
  },
  popQuizOptionCorrect: {
    borderColor: "#28a745",
    backgroundColor: "#28a74520",
  },
  popQuizOptionIncorrect: {
    borderColor: "#dc3545",
    backgroundColor: "#dc354520",
  },
  popQuizFeedback: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
