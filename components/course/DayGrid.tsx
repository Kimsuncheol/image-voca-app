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
  canAccessFeature: (featureId: string) => boolean;
  courseId: string;
  freeDayLimit: number;
  onDayPress: (day: number) => void;
  onQuizPress: (day: number) => void;
}

export function DayGrid({
  totalDays,
  dayProgress,
  courseColor,
  canAccessUnlimitedVoca,
  canAccessFeature,
  courseId,
  freeDayLimit,
  onDayPress,
  onQuizPress,
}: DayGridProps) {
  return (
    <View style={styles.daysGrid}>
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        const progress = dayProgress[day];
        const featureId = `${courseId}_day_${day}`;
        const isDayUnlocked = canAccessFeature(featureId);
        const isLocked =
          !canAccessUnlimitedVoca && !isDayUnlocked && day > freeDayLimit;

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
