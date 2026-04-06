/**
 * ====================================
 * QUIZ HELPER FUNCTIONS
 * ====================================
 *
 * Utility functions for quiz generation and data processing.
 */

import type { CourseType } from "../../../src/types/vocabulary";
import type { ResolvedQuizVocabulary } from "../../../src/utils/localizedVocabulary";
import { normalizeSynonyms } from "../../../src/utils/synonyms";

/**
 * Get dynamic font size based on text length.
 * Longer collocations/words get smaller fonts to fit properly.
 *
 * @param text - The text to measure
 * @returns Font size in pixels
 */
export function getDynamicFontSize(text: string): number {
  const length = text.length;
  if (length <= 10) return 24;
  if (length <= 15) return 22;
  if (length <= 20) return 20;
  if (length <= 25) return 18;
  if (length <= 30) return 16;
  return 14;
}

/**
 * Helper to get Firestore collection path based on course ID.
 *
 * @param courseId - The course identifier
 * @returns Firestore collection path from environment variables
 */
export function getCoursePath(courseId: string): string {
  if (courseId.startsWith("JLPT_N")) {
    return process.env[`EXPO_PUBLIC_COURSE_PATH_${courseId}`] || "";
  }

  switch (courseId) {
    case "수능":
      return process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "";
    case "TOEIC":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "";
    case "TOEFL_IELTS":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL_IELTS || "";
    case "COLLOCATION":
      return process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION || "";
    default:
      return "";
  }
}

/**
 * Normalize word data to ensure consistent structure across different courses.
 * Collocation course uses 'collocation' field instead of 'word'.
 *
 * @param data - Raw word data from Firestore
 * @param courseId - The course identifier
 * @returns Normalized word data with consistent 'word' field
 */
export function normalizeWordData(data: any, courseId: string): any {
  if (courseId === "COLLOCATION") {
    return {
      word: data.collocation,
      meaning: data.meaning,
      ...data,
    };
  }
  return data;
}

/**
 * Helper to create a cloze sentence by replacing the target word with a blank
 *
 * @param example - The example sentence
 * @param word - The word to replace with blank
 * @returns Sentence with word replaced by "___"
 */
export function createClozeSentence(example: string, word: string): string {
  if (!example || !word) return "";
  return example.split(word).join("___");
}

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export type DashboardQuizType =
  | "multiple-choice"
  | "matching"
  | "synonym-matching"
  | "fill-in-blank";

export type ResolvedDashboardQuizVocabulary = ResolvedQuizVocabulary & {
  course?: CourseType;
  synonyms?: string[];
};

export interface DashboardQuizItem {
  word: string;
  meaning: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  example?: string;
}

export interface DashboardWordOption {
  word: string;
  pronunciation?: string;
  pronunciationRoman?: string;
}

export interface DashboardMatchingPair {
  word: string;
  meaning: string;
  synonym?: string;
  pronunciation?: string;
  pronunciationRoman?: string;
}

export interface DashboardQuizPayload {
  quizItem: DashboardQuizItem;
  options: string[];
  wordOptions: DashboardWordOption[];
  matchingPairs: DashboardMatchingPair[];
}

const toDashboardQuizItem = (
  word: ResolvedDashboardQuizVocabulary,
  example?: string,
): DashboardQuizItem => ({
  word: word.word,
  meaning: word.meaning,
  pronunciation: word.course === "COLLOCATION" ? undefined : word.pronunciation,
  pronunciationRoman:
    word.course === "COLLOCATION" ? undefined : word.pronunciationRoman,
  example,
});

export function buildDashboardQuizPayload(
  targetWord: ResolvedDashboardQuizVocabulary,
  batch: ResolvedDashboardQuizVocabulary[],
  quizType: DashboardQuizType,
): DashboardQuizPayload | null {
  if (batch.length < 4) return null;

  const availableWords = batch.filter((word) => word.word !== targetWord.word);
  const shuffledAvailable = shuffleArray(availableWords);

  if (quizType === "synonym-matching") {
    const targetSynonym = normalizeSynonyms(targetWord.synonyms)[0];
    if (!targetSynonym) {
      return null;
    }

    const synonymWords = batch.filter(
      (word) =>
        word.course === "TOEFL_IELTS" &&
        word.word !== targetWord.word &&
        normalizeSynonyms(word.synonyms).length > 0,
    );

    if (synonymWords.length < 3) {
      return null;
    }

    const otherPairs: DashboardMatchingPair[] = shuffleArray(synonymWords)
      .slice(0, 3)
      .map((word) => ({
        word: word.word,
        meaning: word.meaning,
        synonym: normalizeSynonyms(word.synonyms)[0],
        pronunciation: word.pronunciation,
        pronunciationRoman: word.pronunciationRoman,
      }));

    return {
      quizItem: toDashboardQuizItem(targetWord),
      options: [],
      wordOptions: [],
      matchingPairs: shuffleArray([
        {
          word: targetWord.word,
          meaning: targetWord.meaning,
          synonym: targetSynonym,
          pronunciation: targetWord.pronunciation,
          pronunciationRoman: targetWord.pronunciationRoman,
        },
        ...otherPairs,
      ]),
    };
  }

  if (quizType === "matching") {
    const otherPairs: DashboardMatchingPair[] = shuffledAvailable
      .slice(0, 3)
      .map((word) => ({
        word: word.word,
        meaning: word.meaning,
        pronunciation: word.pronunciation,
        pronunciationRoman: word.pronunciationRoman,
      }));

    return {
      quizItem: toDashboardQuizItem(targetWord),
      options: [],
      wordOptions: [],
      matchingPairs: shuffleArray([
        {
          word: targetWord.word,
          meaning: targetWord.meaning,
          pronunciation: targetWord.pronunciation,
          pronunciationRoman: targetWord.pronunciationRoman,
        },
        ...otherPairs,
      ]),
    };
  }

  if (quizType === "fill-in-blank") {
    const wordOptions: DashboardWordOption[] = shuffleArray([
      ...shuffledAvailable.slice(0, 3).map((word) => ({
        word: word.word,
        pronunciation: word.pronunciation,
        pronunciationRoman: word.pronunciationRoman,
      })),
      {
        word: targetWord.word,
        pronunciation: targetWord.pronunciation,
        pronunciationRoman: targetWord.pronunciationRoman,
      },
    ]);

    return {
      quizItem: toDashboardQuizItem(
        targetWord,
        createClozeSentence(targetWord.example ?? "", targetWord.word),
      ),
      options: [],
      wordOptions,
      matchingPairs: [],
    };
  }

  const distractors = shuffledAvailable
    .slice(0, 3)
    .map((word) => word.meaning);
  const options = shuffleArray([...distractors, targetWord.meaning]);

  return {
    quizItem: toDashboardQuizItem(targetWord),
    options,
    wordOptions: [],
    matchingPairs: [],
  };
}

/**
 * Helper to tokenize sentence into chunks for word arrangement
 *
 * @param sentence - The sentence to tokenize
 * @returns Array of words/chunks
 */
export function tokenizeSentence(sentence: string): string[] {
  return sentence.split(/\s+/).filter((chunk) => chunk.length > 0);
}

/**
 * Represents a parsed dialogue line with speaker/prefix and text
 */
export interface DialogueLine {
  speaker: string | null; // Prefix: speaker ("Jane:") or number ("1.") or null
  text: string; // The text after prefix
  fullLine: string; // Complete line for validation
  matchedTranslation: string | null; // Corresponding translation line
}

/**
 * Split text into individual lines by newlines and dialogue markers.
 */
function splitIntoLines(text: string): string[] {
  return text
    .split(/\n|--\s*\(\d+\)|--(?=\s*[A-Z])/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Extract a random line from a multi-line example and match the corresponding
 * translation line by index. Also detects speaker prefixes ("Jane:") and
 * numbered prefixes ("1.") for auto-filling in the quiz.
 *
 * @param example - The full example text (may be multi-line)
 * @param translation - Optional full translation text (may be multi-line)
 * @returns Object with speaker/prefix, text, fullLine, and matchedTranslation
 */
export function extractRandomExampleLine(
  example: string,
  translation?: string,
): DialogueLine {
  if (!example) {
    return {
      speaker: null,
      text: example,
      fullLine: example,
      matchedTranslation: translation || null,
    };
  }

  const exampleLines = splitIntoLines(example);
  const translationLines = translation ? splitIntoLines(translation) : [];

  // Pick random index (limited to lines that have matching translations if translation exists)
  const maxIndex =
    translationLines.length > 0
      ? Math.min(exampleLines.length, translationLines.length)
      : exampleLines.length;
  const randomIndex = Math.floor(Math.random() * maxIndex);

  const selectedLine = exampleLines[randomIndex]?.trim();
  if (!selectedLine) {
    return {
      speaker: null,
      text: example,
      fullLine: example,
      matchedTranslation: translation || null,
    };
  }

  // Get matched translation line
  const matchedTranslation =
    randomIndex < translationLines.length
      ? translationLines[randomIndex]
      : null;

  // Check speaker format ("Name: text")
  const speakerMatch = selectedLine.match(/^([^:]+):\s*(.+)$/);
  if (speakerMatch) {
    return {
      speaker: speakerMatch[1].trim() + ":",
      text: speakerMatch[2].trim(),
      fullLine: selectedLine,
      matchedTranslation,
    };
  }

  // Check numbered format ("1. text", "2. text")
  const numberMatch = selectedLine.match(/^(\d+\.)\s+(.+)$/);
  if (numberMatch) {
    return {
      speaker: numberMatch[1],
      text: numberMatch[2].trim(),
      fullLine: selectedLine,
      matchedTranslation,
    };
  }

  // No prefix
  return {
    speaker: null,
    text: selectedLine,
    fullLine: selectedLine,
    matchedTranslation,
  };
}
