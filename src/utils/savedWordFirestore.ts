import type { SavedWord } from "../../components/wordbank/WordCard";

function removeUndefinedDeep(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, nestedValue]) => [key, removeUndefinedDeep(nestedValue)] as const)
      .filter(([, nestedValue]) => nestedValue !== undefined);

    if (entries.length === 0) {
      return undefined;
    }

    return Object.fromEntries(entries);
  }

  return value;
}

export function sanitizeSavedWordForFirestore(word: SavedWord): SavedWord {
  return removeUndefinedDeep(word) as SavedWord;
}
