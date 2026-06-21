import { useEffect, useRef } from "react";

import { useAuth } from "../context/AuthContext";
import { useLearningLanguage } from "../context/LearningLanguageContext";
import {
  syncLockScreenVocabularyPayload,
  writeLockScreenVocabularyPayload,
} from "../services/lockScreenVocabulary";
import { subscribeLockScreenStudyPreferences } from "../services/lockScreenStudyPreferences";
import type { CourseType } from "../types/vocabulary";

type UserStatsStoreModule = typeof import("../stores/userStatsStore");

const loadUserStatsStore = (): UserStatsStoreModule | null => {
  try {
    return require("../stores/userStatsStore") as UserStatsStoreModule;
  } catch {
    return null;
  }
};

export const useLockScreenVocabularySync = () => {
  const { user } = useAuth();
  const { isReady, learningLanguage, recentCourseByLanguage } =
    useLearningLanguage();
  const latestRequestRef = useRef(0);

  useEffect(() => {
    if (!isReady) return;

    const storeModule = loadUserStatsStore();
    if (!storeModule) {
      void writeLockScreenVocabularyPayload(null).catch((error) => {
        console.warn("Failed to clear lock screen vocabulary:", error);
      });
      return;
    }

    const { useUserStatsStore } = storeModule;
    let isActive = true;
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    const refresh = () => {
      const { courseProgress, fetchCourseProgress } =
        useUserStatsStore.getState();

      void syncLockScreenVocabularyPayload({
        learningLanguage,
        recentCourseByLanguage,
        courseProgressByCourse: courseProgress,
        fetchCourseProgress:
          user == null
            ? undefined
            : async (courseId: CourseType) => {
                await fetchCourseProgress(user.uid, courseId);
                if (!isActive || latestRequestRef.current !== requestId) {
                  return undefined;
                }
                return useUserStatsStore.getState().courseProgress[courseId];
              },
      }).catch((error) => {
        console.warn("Failed to refresh lock screen vocabulary:", error);
      });
    };

    refresh();

    const unsubscribe = useUserStatsStore.subscribe((state, previousState) => {
      if (state.courseProgress !== previousState.courseProgress) {
        refresh();
      }
    });
    const unsubscribePreferences = subscribeLockScreenStudyPreferences(() => {
      refresh();
    });

    return () => {
      isActive = false;
      unsubscribe();
      unsubscribePreferences();
    };
  }, [
    isReady,
    learningLanguage,
    recentCourseByLanguage,
    user,
  ]);
};
