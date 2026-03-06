import React from "react";
import { WordCardSkeleton } from "../wordbank/WordCardSkeleton";

interface SkeletonListProps {
  courseId: string;
  isDark: boolean;
  count?: number;
}

export function SkeletonList({ isDark, count = 3 }: SkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <WordCardSkeleton key={`skeleton-${index}`} isDark={isDark} />
      ))}
    </>
  );
}
