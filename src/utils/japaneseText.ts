const KANA_PARENS_REGEX = /[（(][\u3040-\u30FF\u30FC]+[）)]/g;

export function stripKanaParens(text: string): string {
  return text.replace(KANA_PARENS_REGEX, "").replace(/\s{2,}/g, " ").trim();
}
