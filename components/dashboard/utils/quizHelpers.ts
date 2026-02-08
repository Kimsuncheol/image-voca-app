/**
 * ====================================
 * QUIZ HELPER FUNCTIONS
 * ====================================
 *
 * Utility functions for quiz generation and data processing.
 */

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
  switch (courseId) {
    case "수능":
      return process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "";
    case "TOEIC":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "";
    case "TOEFL":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL || "";
    case "TOEIC_SPEAKING":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING || "";
    case "IELTS":
      return process.env.EXPO_PUBLIC_COURSE_PATH_IELTS || "";
    case "OPIC":
      return process.env.EXPO_PUBLIC_COURSE_PATH_OPIC || "";
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
  // Simple replacement - replace the word with ___
  const regex = new RegExp(`\\b${word}\\w*\\b`, "gi");
  return example.replace(regex, "___");
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
