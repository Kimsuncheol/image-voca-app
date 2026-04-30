import { Dimensions } from "react-native";

const CSAT_IDIOMS_COURSE_ID = "CSAT_IDIOMS";
const EXTREMELY_ADVANCED_COURSE_ID = "EXTREMELY_ADVANCED";
const NUMBERED_MEANING_DISPLAY_COURSE_IDS = new Set([
  CSAT_IDIOMS_COURSE_ID,
  EXTREMELY_ADVANCED_COURSE_ID,
]);
const TITLE_AVAILABLE_WIDTH_RATIO = 0.8;
const BOLD_CHARACTER_WIDTH_RATIO = 0.6;
const STUDY_CARD_TITLE_FONT_SIZE = 48;
const STUDY_CARD_MINIMUM_TITLE_FONT_SIZE = 32;
const WORD_BANK_TITLE_FONT_SIZE = 22;
const WORD_BANK_MINIMUM_TITLE_FONT_SIZE = 16;
const DEFAULT_MINIMUM_TITLE_FONT_SIZE = 12;
const MAX_IDIOM_TITLE_LINE_LENGTH = 24;

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

export function formatIdiomTitleForDisplay(
  title: string,
  courseId?: string,
): string {
  if (!isNumberedMeaningDisplayCourseId(courseId)) {
    return title;
  }

  const titleWithExplicitBreaks = title.replace(/(\S)[ \t]+(?=[[/])/g, "$1\n");
  return titleWithExplicitBreaks
    .split("\n")
    .flatMap((line) => wrapIdiomTitleLine(line))
    .join("\n");
}

function wrapIdiomTitleLine(line: string): string[] {
  if (line.length <= MAX_IDIOM_TITLE_LINE_LENGTH) {
    return [line];
  }

  const words = line.split(/[ \t]+/).filter(Boolean);
  if (words.length <= 1) {
    return [line];
  }

  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= MAX_IDIOM_TITLE_LINE_LENGTH || !currentLine) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function getIdiomTitleFontSize(
  text: string,
  courseId?: string,
  fallbackFontSize = 32,
): number {
  if (!isNumberedMeaningDisplayCourseId(courseId)) {
    return fallbackFontSize;
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    return fallbackFontSize;
  }

  const { width } = Dimensions.get("window");
  const availableWidth = width * TITLE_AVAILABLE_WIDTH_RATIO;
  const estimatedWidth =
    normalizedText.length * fallbackFontSize * BOLD_CHARACTER_WIDTH_RATIO;

  if (estimatedWidth <= availableWidth) {
    return fallbackFontSize;
  }

  const scaledFontSize =
    availableWidth / (normalizedText.length * BOLD_CHARACTER_WIDTH_RATIO);
  const minimumFontSize =
    fallbackFontSize >= STUDY_CARD_TITLE_FONT_SIZE
      ? STUDY_CARD_MINIMUM_TITLE_FONT_SIZE
      : fallbackFontSize >= WORD_BANK_TITLE_FONT_SIZE
        ? WORD_BANK_MINIMUM_TITLE_FONT_SIZE
        : DEFAULT_MINIMUM_TITLE_FONT_SIZE;

  return Math.max(
    minimumFontSize,
    Math.min(fallbackFontSize, scaledFontSize),
  );
}
