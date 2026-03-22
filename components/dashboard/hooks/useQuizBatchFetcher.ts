/**
 * ====================================
 * QUIZ BATCH FETCHER HOOK
 * ====================================
 *
 * Custom hook for fetching and caching quiz word batches from Firestore.
 * Handles batch prefetching with retry logic and caching.
 */

import { useCallback, useRef, useState } from "react";
import {
  fetchVocabularyCardsFromFirestore,
  getCachedVocabularyCards,
  getCourseConfig,
  getTotalDaysForCourse,
} from "../../../src/services/vocabularyPrefetch";
import { CourseType, VocabularyCard } from "../../../src/types/vocabulary";

type QuizCourseConfig = {
  id: CourseType;
  wordsPerCourse: number;
};

const QUIZ_DAY_FETCH_LIMIT = 15;
const MIN_DAYS_TO_TRY = 3;

export function useQuizBatchFetcher(courseConfigs: QuizCourseConfig[]) {
  // ============================================================================
  // STATE
  // ============================================================================
  const [isPrefetching, setIsPrefetching] = useState(false);

  // ============================================================================
  // CACHES
  // ============================================================================
  // Cache for fetched batches (key: "courseId-dayNum", value: word array)
  const batchCache = useRef<Map<string, VocabularyCard[]>>(new Map());

  // ============================================================================
  // FETCH WORDS FROM COURSE
  // ============================================================================
  /**
   * Fetch words from a specific course for pop quiz.
   * Returns an array of words or empty array if no words found.
   * Collects words from multiple days if needed to reach target count.
   */
  const fetchWordsFromCourse = useCallback(
    async (courseId: CourseType, count: number): Promise<VocabularyCard[]> => {
      const config = getCourseConfig(courseId);
      if (!config.path) {
        console.log(`No path configured for course: ${courseId}`);
        return [];
      }

      const collectedWords: VocabularyCard[] = [];
      const totalDays = await getTotalDaysForCourse(courseId);

      if (totalDays <= 0) {
        console.log(
          `[PopQuiz] Skipping ${courseId}: totalDays is ${totalDays} (no available days)`,
        );
        return [];
      }

      const daysToTry = Array.from(
        { length: totalDays },
        (_, index) => index + 1,
      ).sort(() => Math.random() - 0.5);

      let attemptedDays = 0;
      let maxDaysToTry = Math.min(
        totalDays,
        Math.max(MIN_DAYS_TO_TRY, Math.ceil(count / QUIZ_DAY_FETCH_LIMIT) + 1),
      );

      for (const dayNum of daysToTry) {
        if (collectedWords.length >= count || attemptedDays >= maxDaysToTry) {
          break;
        }

        attemptedDays += 1;
        const subCollectionName = `Day${dayNum}`;
        const cacheKey = `${courseId}-${dayNum}`;

        const localCached = batchCache.current.get(cacheKey);
        if (localCached && localCached.length > 0) {
          const shuffled = [...localCached].sort(() => Math.random() - 0.5);
          const wordsToTake = Math.min(
            shuffled.length,
            count - collectedWords.length,
          );
          collectedWords.push(...shuffled.slice(0, wordsToTake));
          console.log(
            `Using ${wordsToTake} cached words from ${courseId} - ${subCollectionName}`,
          );
        } else {
          const sharedCached = getCachedVocabularyCards(courseId, dayNum);
          if (sharedCached && sharedCached.length > 0) {
            batchCache.current.set(cacheKey, sharedCached);
            const shuffled = [...sharedCached].sort(() => Math.random() - 0.5);
            const wordsToTake = Math.min(
              shuffled.length,
              count - collectedWords.length,
            );
            collectedWords.push(...shuffled.slice(0, wordsToTake));
            console.log(
              `Using ${wordsToTake} shared cached words from ${courseId} - ${subCollectionName}`,
            );
          } else {
            try {
              const allDocs = await fetchVocabularyCardsFromFirestore(
                courseId,
                dayNum,
                {
                  limitCount: QUIZ_DAY_FETCH_LIMIT,
                },
              );

              if (allDocs.length > 0) {
                batchCache.current.set(cacheKey, allDocs);
                const shuffled = [...allDocs].sort(() => Math.random() - 0.5);
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
        }

        if (
          attemptedDays === maxDaysToTry &&
          collectedWords.length < count
        ) {
          const remainingWords = count - collectedWords.length;
          maxDaysToTry = Math.min(
            totalDays,
            maxDaysToTry +
              Math.max(1, Math.ceil(remainingWords / QUIZ_DAY_FETCH_LIMIT)),
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
      const allWords: VocabularyCard[] = [];

      const fetchPromises = courseConfigs.map(async ({ id, wordsPerCourse }) => {
        const words = await fetchWordsFromCourse(id, wordsPerCourse);
        return { courseId: id, words };
      });

      const results = await Promise.all(fetchPromises);

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

      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      console.log(
        `Total batch size: ${shuffled.length} words (shuffled from multiple courses)`,
      );

      return shuffled;
    } catch (e) {
      console.error("Batch fetch error", e);
      return [];
    }
  }, [courseConfigs, fetchWordsFromCourse]);

  // ============================================================================
  // PREFETCH NEXT BATCH
  // ============================================================================
  /**
   * Prefetch the next batch in the background with retry logic.
   * Uses exponential backoff for failed attempts.
   */
  const prefetchNextBatch = useCallback(async (): Promise<VocabularyCard[]> => {
    if (isPrefetching) return [];

    setIsPrefetching(true);

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

        attempt++;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
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

    console.warn("Failed to prefetch next batch after all retries");
    setIsPrefetching(false);
    return [];
  }, [fetchBatch, isPrefetching]);

  return {
    fetchBatch,
    prefetchNextBatch,
    isPrefetching,
  };
}
