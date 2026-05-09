import type { TextStyle } from "react-native";
import type { ReviewMaskTarget } from "../services/speechPreferences";

type ReviewMaskSegment = {
  text: string;
  masked: boolean;
};

export type ReviewMaskField =
  | "word"
  | "pronunciation"
  | "reading"
  | "meaning"
  | "example"
  | "synonym";

const MASK_START = "[[[";
const MASK_END = "]]]";

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
    color: isDark ? "#000000" : "#ffffff",
    backgroundColor: "transparent",
    borderRadius: 4,
    overflow: "hidden",
  };
}

export function shouldMaskReviewContent(
  isReviewMode: boolean,
  reviewMaskTarget: ReviewMaskTarget = "word",
  field: ReviewMaskField,
): boolean {
  if (!isReviewMode) {
    return false;
  }

  const normalizedTarget =
    reviewMaskTarget === "word-pronunciation" ? "word" : reviewMaskTarget;

  if (normalizedTarget === "all") {
    return true;
  }

  if (normalizedTarget === "word") {
    return field === "word";
  }

  if (normalizedTarget === "meaning") {
    return field === "meaning";
  }

  if (normalizedTarget === "reading") {
    return field === "reading" || field === "pronunciation";
  }

  if (normalizedTarget === "example") {
    return field === "example";
  }

  if (normalizedTarget === "synonym") {
    return field === "synonym";
  }

  return false;
}
