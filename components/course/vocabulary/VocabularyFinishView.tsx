import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VocabularyFinishViewProps {
  isDark: boolean;
  onQuiz: () => void;
  onRestart: () => void;
  // Passing translation strings or function is usually better than relying on hook inside if we want it pure,
  // but using hook is fine for convenience.
  t: (key: string) => string;
}

export const VocabularyFinishView: React.FC<VocabularyFinishViewProps> = ({
  isDark,
  onQuiz,
  onRestart,
  t,
}) => {
  return (
    <View style={styles.finishedContainer}>
      <Text style={[styles.finishedText, { color: isDark ? "#fff" : "#000" }]}>
        {t("course.checked")}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.quizButton]}
          onPress={onQuiz}
        >
          <Text style={styles.buttonText}>{t("course.takeQuiz")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.restartButton]}
          onPress={onRestart}
        >
          <Text style={styles.buttonText}>{t("common.restart")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
