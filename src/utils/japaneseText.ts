const KANA_PARENS_REGEX = /[（(][\u3040-\u30FF\u30FC]+[）)]/g;
const KANA_PARENS_SEGMENT_REGEX = /([（(][\u3040-\u30FF\u30FC]+[）)])/g;
const KANA_PARENS_EXACT_REGEX = /^[（(][\u3040-\u30FF\u30FC]+[）)]$/;

export interface JapaneseTextSegment {
  text: string;
  isKanaParen: boolean;
}

export function stripKanaParens(text: string): string {
  return text.replace(KANA_PARENS_REGEX, "").replace(/\s{2,}/g, " ").trim();
}

export function splitJapaneseTextSegments(text: string): JapaneseTextSegment[] {
  return text
    .split(KANA_PARENS_SEGMENT_REGEX)
    .filter(Boolean)
    .map((segment) => ({
      text: segment,
      isKanaParen: KANA_PARENS_EXACT_REGEX.test(segment),
    }));
}
