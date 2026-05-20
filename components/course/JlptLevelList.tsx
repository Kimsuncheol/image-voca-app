import React from "react";
import { JLPTLevelCourse } from "../../src/types/vocabulary";
import { JlptLevelCard } from "./JlptLevelCard";

interface JlptLevelListProps {
  levels: JLPTLevelCourse[];
  onLevelPress: (level: JLPTLevelCourse) => void;
  completedLevelIds?: Partial<Record<JLPTLevelCourse["id"], boolean>>;
}

export function JlptLevelList({
  levels,
  onLevelPress,
  completedLevelIds = {},
}: JlptLevelListProps) {
  return (
    <>
      {levels.map((level) => (
        <JlptLevelCard
          key={level.id}
          level={level}
          isCompleted={completedLevelIds[level.id] === true}
          onPress={() => onLevelPress(level)}
        />
      ))}
    </>
  );
}
