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
 */
export const QUIZ_COURSES = [
  { id: "수능", wordsPerCourse: 3 },
  { id: "COLLOCATION", wordsPerCourse: 3 },
  { id: "TOEIC", wordsPerCourse: 3 },
  { id: "TOEFL", wordsPerCourse: 3 },
  { id: "IELTS", wordsPerCourse: 3 },
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
