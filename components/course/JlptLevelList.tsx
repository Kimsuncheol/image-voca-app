import React from "react";
import { JLPTLevelCourse } from "../../src/types/vocabulary";
import { JlptLevelCard } from "./JlptLevelCard";

interface JlptLevelListProps {
  levels: JLPTLevelCourse[];
  totalDaysByLevel: Partial<Record<JLPTLevelCourse["id"], number>>;
  onLevelPress: (level: JLPTLevelCourse) => void;
}

export function JlptLevelList({
  levels,
  totalDaysByLevel,
  onLevelPress,
}: JlptLevelListProps) {
  return (
    <>
      {levels.map((level) => (
        <JlptLevelCard
          key={level.id}
          level={level}
          totalDays={totalDaysByLevel[level.id]}
          onPress={() => onLevelPress(level)}
        />
      ))}
    </>
  );
}
