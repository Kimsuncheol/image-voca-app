export function formatSynonyms(synonyms?: string[]): string | undefined {
  if (!Array.isArray(synonyms)) return undefined;

  const normalized = synonyms
    .map((synonym) => (typeof synonym === "string" ? synonym.trim() : ""))
    .filter(Boolean);

  return normalized.length > 0 ? normalized.join(", ") : undefined;
}
