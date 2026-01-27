import React from "react";
import { CollocationSkeleton } from "../CollocationFlipCard";
import { WordCardSkeleton } from "../wordbank/WordCardSkeleton";

interface SkeletonListProps {
  courseId: string;
  isDark: boolean;
  count?: number;
}

/**
 * Skeleton List Component
 *
 * Displays loading skeleton placeholders while word data is being fetched
 * - Uses CollocationSkeleton for COLLOCATION course
 * - Uses WordCardSkeleton for other courses
 */
export function SkeletonList({
  courseId,
  isDark,
  count = 3,
}: SkeletonListProps) {
  // COLLOCATION course uses special flip card skeleton
  if (courseId === "COLLOCATION") {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <CollocationSkeleton key={`skeleton-${index}`} />
        ))}
      </>
    );
  }

  // Regular courses use standard word card skeleton
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <WordCardSkeleton key={`skeleton-${index}`} isDark={isDark} />
      ))}
    </>
  );
}
