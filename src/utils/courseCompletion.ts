import type { CourseProgress } from "../stores/userStatsStore";

export const isCourseFullyCompleted = (
  dayProgress: CourseProgress | undefined,
  totalDays: number | undefined,
) => {
  if (!totalDays || totalDays <= 0) return false;
  if (!dayProgress) return false;

  for (let day = 1; day <= totalDays; day += 1) {
    if (dayProgress[day]?.completed !== true) {
      return false;
    }
  }

  return true;
};

export const isJlptParentCompleted = (
  levelCompletionMap: Record<string, boolean>,
) => {
  const values = Object.values(levelCompletionMap);
  return values.length > 0 && values.every(Boolean);
};
