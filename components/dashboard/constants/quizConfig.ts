/**
 * ====================================
 * QUIZ CONFIGURATION CONSTANTS
 * ====================================
 *
 * Centralized configuration for the pop quiz feature.
 */

import { CourseType } from "../../../src/types/vocabulary";

/**
 * Target courses for pop quiz with word allocation per course
 * Each course contributes a specified number of words to each batch
 *
 * MATCHING QUIZ REQUIREMENTS:
 * - Need at least 20 words per batch for round-based matching (5 rounds × 4 words)
 * - Increased to 8 words per course to ensure sufficient words even if some courses fail
 * - Total target: 40 words per batch (5 courses × 8 words)
 * - Ensures we get 20+ words even if only 2-3 courses return data
 */
export const QUIZ_COURSES = [
  { id: "수능", wordsPerCourse: 8 },
  { id: "COLLOCATION", wordsPerCourse: 8 },
  { id: "TOEIC", wordsPerCourse: 8 },
  { id: "TOEFL", wordsPerCourse: 8 },
  { id: "IELTS", wordsPerCourse: 8 },
] as const;

/**
 * Courses to log total days for debugging purposes
 */
export const DEBUG_TOTAL_DAYS_COURSES: CourseType[] = [
  "수능",
  "COLLOCATION",
  "TOEIC",
  "TOEFL",
  "IELTS",
  "OPIC",
  "TOEIC_SPEAKING",
];
