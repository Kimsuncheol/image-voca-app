import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

interface SwipeStudyTimerProps {
  elapsedSeconds: number;
  label: string;
  isDark: boolean;
}

const LOOP_DURATION_SECONDS = 60;
const TIMER_OFFSET = Dimensions.get("window").height / 30;
const PROGRESS_REFRESH_MS = 50;

const formatElapsedTime = (elapsedSeconds: number) => {
  const safeSeconds = Math.max(0, elapsedSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export function SwipeStudyTimer({
  elapsedSeconds,
  label,
  isDark,
}: SwipeStudyTimerProps) {
  const [tickMs, setTickMs] = React.useState(() => Date.now());
  const syncedAtMsRef = React.useRef(Date.now());

  React.useEffect(() => {
    syncedAtMsRef.current = Date.now();
    setTickMs(syncedAtMsRef.current);
  }, [elapsedSeconds]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTickMs(Date.now());
    }, PROGRESS_REFRESH_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fractionalSeconds = Math.min(
    0.999,
    Math.max(0, (tickMs - syncedAtMsRef.current) / 1000),
  );
  const loopProgress =
    ((Math.max(0, elapsedSeconds) + fractionalSeconds) % LOOP_DURATION_SECONDS) /
    LOOP_DURATION_SECONDS;

  return (
    <View style={styles.container} testID="swipe-study-timer">
      <View style={styles.header}>
        <Text
          style={[
            styles.label,
            { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(17,24,28,0.64)" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[styles.value, { color: isDark ? "#FFFFFF" : "#11181C" }]}
          testID="swipe-study-timer-value"
        >
          {formatElapsedTime(elapsedSeconds)}
        </Text>
      </View>

      <View
        style={[
          styles.track,
          { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "#D8E0EA" },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${loopProgress * 100}%`,
              backgroundColor: isDark ? "#FFFFFF" : "#0A7EA4",
            },
          ]}
          testID="swipe-study-timer-fill"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: -TIMER_OFFSET,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  value: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
