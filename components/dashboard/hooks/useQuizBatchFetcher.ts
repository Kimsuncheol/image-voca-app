/**
 * ====================================
 * QUIZ BATCH FETCHER HOOK
 * ====================================
 *
 * Custom hook for fetching and caching quiz word batches from Firestore.
 * Handles batch prefetching with retry logic and caching.
 */

import { collection, getDocs, limit, query } from "firebase/firestore";
import { useCallback, useRef, useState } from "react";
import { db } from "../../../src/services/firebase";
import { getTotalDaysForCourse } from "../../../src/services/vocabularyPrefetch";
import { CourseType } from "../../../src/types/vocabulary";
import { QUIZ_COURSES } from "../constants/quizConfig";
import { getCoursePath, normalizeWordData } from "../utils/quizHelpers";

export function useQuizBatchFetcher() {
  // ============================================================================
  // STATE
  // ============================================================================
  const [isPrefetching, setIsPrefetching] = useState(false);

  // ============================================================================
  // CACHES
  // ============================================================================
  // Cache for fetched batches (key: "courseId-dayNum", value: word array)
  const batchCache = useRef<Map<string, any[]>>(new Map());
  // Cache for per-course metadata totalDays to avoid repeated Firestore reads
  const totalDaysCache = useRef<Map<string, number>>(new Map());

  // ============================================================================
  // FETCH WORDS FROM COURSE
  // ============================================================================
  /**
   * Fetch words from a specific course for pop quiz.
   * Returns an array of words or empty array if no words found.
   * Collects words from multiple days if needed to reach target count.
   */
  const fetchWordsFromCourse = useCallback(
    async (courseId: string, count: number): Promise<any[]> => {
      const path = getCoursePath(courseId);
      if (!path) {
        console.log(`No path configured for course: ${courseId}`);
        return [];
      }

      const collectedWords: any[] = [];

      // Get or fetch total days for this course
      let totalDays: number;
      const cachedTotalDays = totalDaysCache.current.get(courseId);
      if (typeof cachedTotalDays === "number") {
        totalDays = cachedTotalDays;
        console.log(
          `[PopQuiz] Using cached totalDays for ${courseId}: ${totalDays}`,
        );
      } else {
        totalDays = await getTotalDaysForCourse(courseId as CourseType);
        totalDaysCache.current.set(courseId, totalDays);
        console.log(
          `[PopQuiz] Fetched totalDays from Firestore for ${courseId}: ${totalDays}`,
        );
      }

      if (totalDays <= 0) {
        console.log(
          `[PopQuiz] Skipping ${courseId}: totalDays is ${totalDays} (no available days)`,
        );
        return [];
      }

      // Generate random days to try (1-totalDays from Firestore)
      const daysToTry = Array.from(
        { length: totalDays },
        (_, index) => index + 1,
      )
        .sort(() => Math.random() - 0.5)
        .slice(0, 10); // Try more days to find enough words

      for (const dayNum of daysToTry) {
        if (collectedWords.length >= count) break; // Got enough words

        const subCollectionName = `Day${dayNum}`;
        const cacheKey = `${courseId}-${dayNum}`;

        // Check cache first
        if (batchCache.current.has(cacheKey)) {
          const cachedData = batchCache.current.get(cacheKey)!;
          if (cachedData.length > 0) {
            const shuffled = [...cachedData].sort(() => Math.random() - 0.5);
            const wordsToTake = Math.min(
              shuffled.length,
              count - collectedWords.length,
            );
            collectedWords.push(...shuffled.slice(0, wordsToTake));
            console.log(
              `Using ${wordsToTake} cached words from ${courseId} - ${subCollectionName}`,
            );
            continue;
          }
        }

        try {
          // Fetch words from this day
          const q = query(collection(db, path, subCollectionName), limit(15));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            // Store in cache for future use (normalized)
            const allDocs = snapshot.docs.map((d) =>
              normalizeWordData(d.data(), courseId),
            );
            batchCache.current.set(cacheKey, allDocs);

            // Take as many words as needed
            const shuffled = allDocs.sort(() => Math.random() - 0.5);
            const wordsToTake = Math.min(
              shuffled.length,
              count - collectedWords.length,
            );
            collectedWords.push(...shuffled.slice(0, wordsToTake));
            console.log(
              `Fetched ${wordsToTake} words from ${courseId} - ${subCollectionName}`,
            );
          }
        } catch (error) {
          console.log(
            `Error fetching from ${courseId}/${subCollectionName}:`,
            error,
          );
        }
      }

      if (collectedWords.length === 0) {
        console.log(`No words found for course: ${courseId}`);
      } else {
        console.log(
          `Total collected from ${courseId}: ${collectedWords.length} words`,
        );
      }

      return collectedWords;
    },
    [],
  );

  // ============================================================================
  // FETCH BATCH
  // ============================================================================
  /**
   * Fetch a batch of words from multiple courses.
   * Fetches configured number of words from each course, then shuffles them together.
   * Only includes words from courses that have available data.
   */
  const fetchBatch = useCallback(async () => {
    try {
      const allWords: any[] = [];

      // Fetch words from each target course in parallel
      const fetchPromises = QUIZ_COURSES.map(async ({ id, wordsPerCourse }) => {
        const words = await fetchWordsFromCourse(id, wordsPerCourse);
        return { courseId: id, words };
      });

      const results = await Promise.all(fetchPromises);

      // Collect all successfully fetched words
      for (const { courseId, words } of results) {
        if (words.length > 0) {
          console.log(`Added ${words.length} words from ${courseId}`);
          allWords.push(...words);
        } else {
          console.log(`Skipped ${courseId} - no words available`);
        }
      }

      if (allWords.length === 0) {
        console.warn("No vocabulary data found in any course");
        return [];
      }

      // Shuffle all collected words together
      const shuffled = allWords.sort(() => Math.random() - 0.5);
      console.log(
        `Total batch size: ${shuffled.length} words (shuffled from multiple courses)`,
      );

      return shuffled;
    } catch (e) {
      console.error("Batch fetch error", e);
      return [];
    }
  }, [fetchWordsFromCourse]);

  // ============================================================================
  // PREFETCH NEXT BATCH
  // ============================================================================
  /**
   * Prefetch the next batch in the background with retry logic.
   * Uses exponential backoff for failed attempts.
   */
  const prefetchNextBatch = useCallback(async (): Promise<any[]> => {
    if (isPrefetching) return [];

    setIsPrefetching(true);

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const batch = await fetchBatch();

        if (batch.length > 0) {
          setIsPrefetching(false);
          console.log(`Prefetched next batch (attempt ${attempt + 1})`);
          return batch;
        }

        // If empty batch, retry
        attempt++;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
          console.log(
            `Retrying prefetch in ${delay}ms (attempt ${attempt + 1})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Prefetch attempt ${attempt + 1} failed:`, error);
        attempt++;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.warn("Failed to prefetch next batch after all retries");
    setIsPrefetching(false);
    return [];
  }, [fetchBatch, isPrefetching]);

  return {
    fetchBatch,
    prefetchNextBatch,
    isPrefetching,
    totalDaysCache,
  };
}
