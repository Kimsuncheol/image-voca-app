import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface SpellingGameProps {
  userAnswer: string;
  setUserAnswer: (text: string) => void;
  showResult: boolean;
  isCorrect: boolean;
  onSubmit: () => void;
  courseColor?: string;
  meaning: string;
}

export function SpellingGame({
  userAnswer,
  setUserAnswer,
  showResult,
  isCorrect,
  onSubmit,
  courseColor,
  meaning,
}: SpellingGameProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.questionCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <ThemedText style={styles.questionLabel}>
          {t("quiz.questions.spellPrompt")}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.questionText}>
          {meaning}
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5",
              color: isDark ? "#fff" : "#000",
            },
            showResult && {
              borderColor: isCorrect ? "#28a745" : "#dc3545",
              borderWidth: 2,
            },
          ]}
          placeholder={t("quiz.actions.typeSpelling")}
          placeholderTextColor={isDark ? "#666" : "#999"}
          value={userAnswer}
          onChangeText={setUserAnswer}
          editable={!showResult}
          autoCapitalize="none"
        />
        {!showResult && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: courseColor || "#007AFF" },
            ]}
            onPress={onSubmit}
            disabled={!userAnswer.trim()}
          >
            <ThemedText style={styles.submitButtonText}>
              {t("common.submit")}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    flex: 1,
  },
  questionCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  questionLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
    textAlign: "center",
  },
  questionText: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  inputContainer: {
    gap: 16,
  },
  input: {
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: "500",
  },
  submitButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
