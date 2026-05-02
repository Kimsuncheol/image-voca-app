import type { TextStyle } from "react-native";

export type VocabularyStudyMode = "learning" | "review";

type ReviewMaskSegment = {
  text: string;
  masked: boolean;
};

const MASK_START = "[[[";
const MASK_END = "]]]";

export function normalizeVocabularyStudyMode(
  value?: string | string[],
): VocabularyStudyMode {
  const mode = Array.isArray(value) ? value[0] : value;
  return mode === "review" ? "review" : "learning";
}

export function parseReviewMaskSegments(value?: string): ReviewMaskSegment[] {
  if (!value) return [];

  const segments: ReviewMaskSegment[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const start = value.indexOf(MASK_START, cursor);
    if (start < 0) {
      segments.push({ text: value.slice(cursor), masked: false });
      break;
    }

    if (start > cursor) {
      segments.push({ text: value.slice(cursor, start), masked: false });
    }

    const maskedStart = start + MASK_START.length;
    const end = value.indexOf(MASK_END, maskedStart);

    if (end < 0) {
      segments.push({ text: value.slice(maskedStart), masked: false });
      break;
    }

    segments.push({ text: value.slice(maskedStart, end), masked: true });
    cursor = end + MASK_END.length;
  }

  return segments.filter((segment) => segment.text.length > 0);
}

export function stripReviewMaskDelimiters(value?: string): string {
  return parseReviewMaskSegments(value)
    .map((segment) => segment.text)
    .join("");
}

export function getReviewTapeTextStyle(isDark: boolean): TextStyle {
  return {
    color: "transparent",
    backgroundColor: isDark
      ? "rgba(255, 214, 102, 0.45)"
      : "rgba(250, 204, 21, 0.58)",
    borderRadius: 4,
    overflow: "hidden",
  };
}
