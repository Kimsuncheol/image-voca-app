import React from "react";
import { StyleSheet, View } from "react-native";
import { DayCard } from "./DayCard";

import { DayProgress } from "../../src/stores";
// Removed local DayProgress interface

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

        // Check if previous day is completed (for sequential progression)
        const previousDayCompleted =
          day === 1 || dayProgress[day - 1]?.completed === true;
        const isLockedByProgress = !previousDayCompleted;

        // Check subscription-based lock
        const isLockedBySubscription =
          !canAccessUnlimitedVoca && !isDayUnlocked && day > freeDayLimit;

        // Day is locked if either condition applies
        const isLocked = isLockedByProgress || isLockedBySubscription;

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
