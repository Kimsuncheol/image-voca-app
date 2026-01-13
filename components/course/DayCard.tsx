import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface DayProgress {
  completed: boolean;
  wordsLearned: number;
  totalWords: number;
  quizCompleted: boolean;
}

interface DayCardProps {
  day: number;
  progress?: DayProgress;
  isLocked: boolean;
  courseColor?: string;
  onDayPress: () => void;
  onQuizPress: () => void;
}

export function DayCard({
  day,
  progress,
  isLocked,
  courseColor,
  onDayPress,
  onQuizPress,
}: DayCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const isCompleted = progress?.completed || false;
  const quizCompleted = progress?.quizCompleted || false;

  return (
    <View style={styles.dayCardWrapper}>
      <TouchableOpacity
        style={[
          styles.dayCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
          isCompleted && {
            backgroundColor: courseColor + "20",
            borderWidth: 2,
            borderColor: courseColor,
          },
          isLocked && styles.lockedCard,
        ]}
        onPress={onDayPress}
        activeOpacity={0.7}
      >
        <View style={styles.dayHeader}>
          <ThemedText
            type="subtitle"
            style={[styles.dayNumber, isLocked && styles.lockedText]}
          >
            {t("course.dayTitle", { day })}
          </ThemedText>
          {isLocked ? (
            <Ionicons name="lock-closed" size={16} color="#999" />
          ) : isCompleted ? (
            <Ionicons name="checkmark-circle" size={20} color={courseColor} />
          ) : null}
        </View>
        {progress && !isLocked && (
          <ThemedText style={styles.progressText}>
            {t("course.progress", {
              learned: progress.wordsLearned,
              total: progress.totalWords,
            })}
          </ThemedText>
        )}
      </TouchableOpacity>
      {isCompleted && !isLocked && (
        <TouchableOpacity
          style={[
            styles.quizButton,
            {
              backgroundColor: quizCompleted
                ? "#28a745"
                : courseColor || "#007AFF",
            },
          ]}
          onPress={onQuizPress}
        >
          <Ionicons
            name={quizCompleted ? "trophy" : "play"}
            size={16}
            color="#fff"
          />
          <ThemedText style={styles.quizButtonText}>
            {quizCompleted ? t("course.retake") : t("course.quiz")}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dayCardWrapper: {
    width: "30%",
  },
  dayCard: {
    padding: 12,
    borderRadius: 12,
    minHeight: 80,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 16,
  },
  progressText: {
    fontSize: 11,
    opacity: 0.6,
  },
  quizButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  quizButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  lockedCard: {
    opacity: 0.5,
  },
  lockedText: {
    opacity: 0.6,
  },
});
