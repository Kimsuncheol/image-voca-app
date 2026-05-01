import React from "react";
import { JLPTLevelCourse } from "../../src/types/vocabulary";
import { JlptLevelCard } from "./JlptLevelCard";

interface JlptLevelListProps {
  levels: JLPTLevelCourse[];
  onLevelPress: (level: JLPTLevelCourse) => void;
}

export function JlptLevelList({
  levels,
  onLevelPress,
}: JlptLevelListProps) {
  return (
    <>
      {levels.map((level) => (
        <JlptLevelCard
          key={level.id}
          level={level}
          onPress={() => onLevelPress(level)}
        />
      ))}
    </>
  );
}
