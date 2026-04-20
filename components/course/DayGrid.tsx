import React from "react";
import { StyleSheet, View } from "react-native";
import { DayCard } from "./DayCard";

import { DayProgress } from "../../src/stores";
// Removed local DayProgress interface

interface DayGridProps {
  totalDays: number;
  dayProgress: Record<number, DayProgress>;
  courseColor?: string;
  courseId: string;
  onDayPress: (day: number) => void;
  onQuizPress: (day: number) => void;

}

export function DayGrid({
  totalDays,
  dayProgress,
  courseColor,
  courseId: _courseId,
  onDayPress,
  onQuizPress,

}: DayGridProps) {
  return (
    <View style={styles.daysGrid}>
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        const progress = dayProgress[day];

        // Check if previous day is completed (for sequential progression)
        const previousDayCompleted =
          day === 1 || dayProgress[day - 1]?.completed === true;
        const isLocked = !previousDayCompleted;

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
