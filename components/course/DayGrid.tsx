import React from "react";
import { StyleSheet, View } from "react-native";
import { DayCard } from "./DayCard";

interface DayProgress {
  completed: boolean;
  wordsLearned: number;
  totalWords: number;
  quizCompleted: boolean;
}

interface DayGridProps {
  totalDays: number;
  dayProgress: Record<number, DayProgress>;
  courseColor?: string;
  canAccessUnlimitedVoca: boolean;
  freeDayLimit: number;
  onDayPress: (day: number) => void;
  onQuizPress: (day: number) => void;
}

export function DayGrid({
  totalDays,
  dayProgress,
  courseColor,
  canAccessUnlimitedVoca,
  freeDayLimit,
  onDayPress,
  onQuizPress,
}: DayGridProps) {
  return (
    <View style={styles.daysGrid}>
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        const progress = dayProgress[day];
        const isLocked = !canAccessUnlimitedVoca && day > freeDayLimit;

        return (
          <DayCard
            key={day}
            day={day}
            progress={progress}
            isLocked={isLocked}
            courseColor={courseColor}
            onDayPress={() => onDayPress(day)}
            onQuizPress={() => onQuizPress(day)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
