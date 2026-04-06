export function normalizeSynonyms(synonyms?: string[]): string[] {
  if (!Array.isArray(synonyms)) return [];

  const normalized = synonyms
    .map((synonym) => (typeof synonym === "string" ? synonym.trim() : ""))
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

export function formatSynonyms(synonyms?: string[]): string | undefined {
  const normalized = normalizeSynonyms(synonyms);

  return normalized.length > 0 ? normalized.join(", ") : undefined;
}
