/**
 * vocaParser.ts
 *
 * Pure utility functions for extracting vocabulary fields from raw CSV / Google
 * Sheets rows. Keeping this logic here (rather than inside the React component)
 * means the extraction is stateless, synchronous, and trivially unit-testable.
 */

export type CourseType = "COLLOCATION" | "CSAT" | "IELTS" | "TOEFL" | "TOEIC";

/** Parsed vocabulary entry for standard courses (CSAT, IELTS, TOEFL, TOEIC). */
export interface VocaEntry {
  type: "voca";
  word: string;
  meaning: string;
  translation: string;
  pronunciation: string;
  example: string;
}

/** Parsed entry for the COLLOCATION course. */
export interface CollocationEntry {
  type: "collocation";
  collocation: string;
  meaning: string;
  explanation: string;
  example: string;
  translation: string;
}

export type ParsedEntry = VocaEntry | CollocationEntry;

/**
 * Extracts one vocabulary / collocation entry from a raw CSV/Sheet row object.
 *
 * The function handles the two common column-name conventions produced by
 * PapaParse:
 *   - Standard headers:  "Word", "Meaning", "Pronounciation", …
 *   - Unnamed / numeric headers:  "_1", "_2", "_3", …
 *
 * Returns `null` when the row is empty or is a stray header row.
 *
 * @param item       - Raw object from PapaParse `results.data` or `parseSheetValues`.
 * @param courseName - Name of the target course, used to choose the data shape.
 */
export function extractVocaFields(
  item: Record<string, unknown>,
  courseName: CourseType | string,
): ParsedEntry | null {
  const word = str(
    item["Word"] ||
      item["word"] ||
      item["_1"] ||
      item["Collocation"] ||
      item["collocation"],
  );

  // Skip empty or accidental header rows
  if (
    !word ||
    word === "Word" ||
    word === "word" ||
    word === "Collocation" ||
    word === "collocation"
  ) {
    return null;
  }

  if (courseName === "COLLOCATION") {
    return {
      type: "collocation",
      collocation: word,
      meaning: str(item["Meaning"] || item["meaning"] || item["_2"]),
      explanation: str(
        item["Explanation"] || item["explanation"] || item["_3"],
      ),
      example: str(item["Example"] || item["example"] || item["_4"]),
      translation: str(
        item["Translation"] || item["translation"] || item["_5"],
      ),
    };
  }

  return {
    type: "voca",
    word,
    meaning: str(item["Meaning"] || item["meaning"] || item["_2"]),
    translation: str(item["Translation"] || item["translation"] || item["_5"]),
    pronunciation: str(
      item["Pronounciation"] ||
        item["Pronunciation"] ||
        item["pronunciation"] ||
        item["_3"],
    ),
    example: str(
      item["Example sentence"] ||
        item["Example"] ||
        item["example"] ||
        item["_4"],
    ),
  };
}

/**
 * Parses a whole array of raw rows, filtering out nulls.
 * Useful when you want to pre-process the entire dataset before iterating.
 */
export function parseVocaData(
  data: Record<string, unknown>[],
  courseName: CourseType | string,
): ParsedEntry[] {
  return data
    .map((item) => extractVocaFields(item, courseName))
    .filter((entry): entry is ParsedEntry => entry !== null);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Safely coerce an unknown value to a trimmed string. */
function str(value: unknown): string {
  return String(value ?? "").trim();
}
