import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VocabularyFinishViewProps {
  isDark: boolean;
  day: number;
  onQuiz: () => void;
  onRestart: () => void;
  onDays: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export const VocabularyFinishView: React.FC<VocabularyFinishViewProps> = ({
  isDark,
  day,
  onQuiz,
  onRestart,
  onDays,
  t,
}) => {
  return (
    <View style={styles.container}>
<View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, styles.quizButton]} onPress={onQuiz}>
          <Ionicons name="clipboard-outline" size={22} color="#1a1a1a" />
          <Text style={styles.buttonText}>{t("course.takeQuiz")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.restartButton]} onPress={onRestart}>
          <Ionicons name="refresh-circle-outline" size={22} color="#1a1a1a" />
          <Text style={styles.buttonText}>{t("common.restart")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.daysButton]} onPress={onDays}>
          <Ionicons name="calendar-outline" size={22} color="#1a1a1a" />
          <Text style={styles.buttonText}>{t("course.finish")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  checkedLabel: {
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 48,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#1a1a1a",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3.84,
    elevation: 5,
  },
  buttonsContainer: {
    width: "100%",
    paddingHorizontal: 16,
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  quizButton: {
    backgroundColor: "#6BCB77",
  },
  restartButton: {
    backgroundColor: "#5B9CDB",
  },
  daysButton: {
    backgroundColor: "#FFD166",
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
});
