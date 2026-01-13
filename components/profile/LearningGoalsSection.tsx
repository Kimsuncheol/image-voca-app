import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface LearningGoalsSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  dailyGoalInput: string;
  onChangeDailyGoal: (value: string) => void;
  onUpdateGoal: () => void;
  t: (key: string) => string;
}

export function LearningGoalsSection({
  styles,
  isDark,
  dailyGoalInput,
  onChangeDailyGoal,
  onUpdateGoal,
  t,
}: LearningGoalsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("profile.sections.learningGoals")}
      </Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("profile.fields.dailyGoal")}</Text>
          <View style={styles.goalInputContainer}>
            <TextInput
              style={styles.goalInput}
              value={dailyGoalInput}
              onChangeText={onChangeDailyGoal}
              keyboardType="number-pad"
              placeholder="20"
              placeholderTextColor={isDark ? "#555" : "#999"}
            />
            <Text style={styles.goalUnit}>{t("profile.fields.wordsPerDay")}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.updateGoalButton} onPress={onUpdateGoal}>
          <Text style={styles.updateGoalButtonText}>
            {t("profile.goal.updateButton")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
