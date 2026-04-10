const CSAT_IDIOMS_COURSE_ID = "CSAT_IDIOMS";
const EXTREMELY_ADVANCED_COURSE_ID = "EXTREMELY_ADVANCED";
const NUMBERED_MEANING_DISPLAY_COURSE_IDS = new Set([
  CSAT_IDIOMS_COURSE_ID,
  EXTREMELY_ADVANCED_COURSE_ID,
]);

export function isCsatIdiomsCourseId(courseId?: string): boolean {
  return courseId === CSAT_IDIOMS_COURSE_ID;
}

export function isNumberedMeaningDisplayCourseId(courseId?: string): boolean {
  return !!courseId && NUMBERED_MEANING_DISPLAY_COURSE_IDS.has(courseId);
}

export function formatIdiomMeaningForDisplay(
  meaning: string,
  courseId?: string,
): string {
  if (!isNumberedMeaningDisplayCourseId(courseId)) {
    return meaning;
  }

  const normalizedMeaning = meaning.replace(/\r\n/g, "\n").trim();
  if (!normalizedMeaning) {
    return normalizedMeaning;
  }

  return normalizedMeaning.replace(/(\S)\s+(?=\d+\.\s)/g, "$1\n");
}

export function getIdiomTitleFontSize(
  text: string,
  courseId?: string,
  fallbackFontSize = 32,
): number {
  if (!isNumberedMeaningDisplayCourseId(courseId)) {
    return fallbackFontSize;
  }

  const length = text.trim().length;
  if (length >= 26) return Math.max(12, fallbackFontSize - 10);
  if (length >= 21) return Math.max(12, fallbackFontSize - 6);
  if (length >= 16) return Math.max(12, fallbackFontSize - 3);
  return fallbackFontSize;
}
