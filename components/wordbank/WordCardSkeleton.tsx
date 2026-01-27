import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface WordCardSkeletonProps {
  isDark?: boolean;
}

/**
 * WordCard Skeleton Component
 *
 * Displays an animated loading placeholder while word data is being fetched
 * Mimics the structure of the actual WordCard component
 */
export function WordCardSkeleton({ isDark = false }: WordCardSkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  return (
    <View
      style={[
        styles.wordCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      {/* Header row with title and actions placeholder */}
      <View style={styles.wordTitleRow}>
        <View style={styles.headerLeft}>
          {/* Word title placeholder */}
          <Animated.View
            style={[
              styles.skeleton,
              styles.titleSkeleton,
              isDark && styles.skeletonDark,
              { opacity: animatedValue },
            ]}
          />
          {/* Day badge placeholder */}
          <Animated.View
            style={[
              styles.skeleton,
              styles.badgeSkeleton,
              isDark && styles.skeletonDark,
              { opacity: animatedValue },
            ]}
          />
        </View>
        <View style={styles.actionButtons}>
          {/* Speaker button placeholder */}
          <Animated.View
            style={[
              styles.skeleton,
              styles.iconSkeleton,
              isDark && styles.skeletonDark,
              { opacity: animatedValue },
            ]}
          />
          {/* Delete button placeholder */}
          <Animated.View
            style={[
              styles.skeleton,
              styles.iconSkeleton,
              isDark && styles.skeletonDark,
              { opacity: animatedValue },
            ]}
          />
        </View>
      </View>

      {/* Pronunciation placeholder */}
      <Animated.View
        style={[
          styles.skeleton,
          styles.pronunciationSkeleton,
          isDark && styles.skeletonDark,
          { opacity: animatedValue },
        ]}
      />

      {/* Meaning placeholder */}
      <Animated.View
        style={[
          styles.skeleton,
          styles.meaningSkeleton,
          isDark && styles.skeletonDark,
          { opacity: animatedValue },
        ]}
      />

      {/* Example section placeholder */}
      <View style={styles.exampleContainer}>
        <Animated.View
          style={[
            styles.skeleton,
            styles.exampleSkeleton,
            isDark && styles.skeletonDark,
            { opacity: animatedValue },
          ]}
        />
        <Animated.View
          style={[
            styles.skeleton,
            styles.translationSkeleton,
            isDark && styles.skeletonDark,
            { opacity: animatedValue },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  wordTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skeleton: {
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
  skeletonDark: {
    backgroundColor: "#2C2C2E",
  },
  titleSkeleton: {
    width: 120,
    height: 22,
    borderRadius: 6,
  },
  badgeSkeleton: {
    width: 50,
    height: 18,
    borderRadius: 8,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  pronunciationSkeleton: {
    width: 100,
    height: 14,
    marginTop: 2,
    marginBottom: 8,
    borderRadius: 4,
  },
  meaningSkeleton: {
    width: "85%",
    height: 15,
    marginBottom: 8,
    borderRadius: 4,
  },
  exampleContainer: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    marginTop: 4,
  },
  exampleSkeleton: {
    width: "95%",
    height: 14,
    marginBottom: 6,
    borderRadius: 4,
  },
  translationSkeleton: {
    width: "75%",
    height: 14,
    borderRadius: 4,
  },
});
