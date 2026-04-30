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
const MINIMUM_IDIOM_TITLE_LINE_LENGTH = 12;

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
  fallbackFontSize = 32,
): string {
  if (!isNumberedMeaningDisplayCourseId(courseId)) {
    return title;
  }

  const titleWithExplicitBreaks = title.replace(/(\S)[ \t]+(?=[[/])/g, "$1\n");
  const maxLineLength = getMaxIdiomTitleLineLength(fallbackFontSize);
  return titleWithExplicitBreaks
    .split("\n")
    .flatMap((line) => wrapIdiomTitleLine(line, maxLineLength))
    .join("\n");
}

function wrapIdiomTitleLine(line: string, maxLineLength: number): string[] {
  if (getIdiomTitleMeasurementLength(line) <= maxLineLength) {
    return [line];
  }

  const words = line.split(/[ \t]+/).filter(Boolean);
  if (words.length <= 1) {
    return [line];
  }

  if (
    words.length <= 2 &&
    words.some((word) => /[^\s()[\]]+[[\(][^\s()[\]]+[\])]/.test(word))
  ) {
    return [line];
  }

  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (getIdiomTitleMeasurementLength(candidate) <= maxLineLength || !currentLine) {
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

function getIdiomTitleMeasurementLength(value: string): number {
  return value.replace(/[[\]()]/g, "").length;
}

function getMaxIdiomTitleLineLength(fallbackFontSize: number): number {
  const { width } = Dimensions.get("window");
  const availableWidth = width * TITLE_AVAILABLE_WIDTH_RATIO;
  const minimumFontSize = getMinimumIdiomTitleFontSize(fallbackFontSize);
  return Math.max(
    MINIMUM_IDIOM_TITLE_LINE_LENGTH,
    Math.floor(
      availableWidth / (minimumFontSize * BOLD_CHARACTER_WIDTH_RATIO),
    ),
  );
}

function getMinimumIdiomTitleFontSize(fallbackFontSize: number): number {
  if (fallbackFontSize >= STUDY_CARD_TITLE_FONT_SIZE) {
    return STUDY_CARD_MINIMUM_TITLE_FONT_SIZE;
  }
  if (fallbackFontSize >= WORD_BANK_TITLE_FONT_SIZE) {
    return WORD_BANK_MINIMUM_TITLE_FONT_SIZE;
  }
  return DEFAULT_MINIMUM_TITLE_FONT_SIZE;
}

export function getIdiomTitleMinimumFontScale(
  courseId: string | undefined,
  fallbackFontSize: number,
  currentFontSize = fallbackFontSize,
): number | undefined {
  if (!isNumberedMeaningDisplayCourseId(courseId)) {
    return undefined;
  }

  const minimumFontSize = getMinimumIdiomTitleFontSize(fallbackFontSize);
  return Math.min(1, minimumFontSize / currentFontSize);
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
  const minimumFontSize = getMinimumIdiomTitleFontSize(fallbackFontSize);

  return Math.max(
    minimumFontSize,
    Math.min(fallbackFontSize, scaledFontSize),
  );
}
