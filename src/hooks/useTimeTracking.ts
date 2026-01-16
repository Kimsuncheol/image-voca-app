import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserStatsStore } from "../stores";

/**
 * Hook to track time spent on a screen and record it to user stats.
 * Automatically starts tracking when screen gains focus and records
 * the time when screen loses focus.
 */
export function useTimeTracking() {
  const { user } = useAuth();
  const { recordTimeSpent } = useUserStatsStore();
  const startTimeRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Screen focused - start tracking
      startTimeRef.current = Date.now();

      return () => {
        // Screen unfocused - record time spent
        if (startTimeRef.current && user) {
          const elapsedMs = Date.now() - startTimeRef.current;
          const elapsedMinutes = Math.round(elapsedMs / 60000);
          
          // Only record if at least 1 minute was spent
          if (elapsedMinutes >= 1) {
            recordTimeSpent(user.uid, elapsedMinutes);
          }
        }
        startTimeRef.current = null;
      };
    }, [user, recordTimeSpent])
  );
}
