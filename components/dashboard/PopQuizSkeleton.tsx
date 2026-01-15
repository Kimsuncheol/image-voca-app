import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";

export function PopQuizSkeleton() {
  const { isDark } = useTheme();
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
      ])
    ).start();
  }, [animatedValue]);

  return (
    <View style={styles.section}>
      {/* Title Placeholder */}
      <View
        style={[
          styles.skeleton,
          styles.titleSkeleton,
          { opacity: 0.5, backgroundColor: isDark ? "#333" : "#E1E9EE" },
        ]}
      />

      <View
        style={[
          styles.popQuizCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <View style={styles.popQuizHeader}>
          <View>
            <Animated.View
              style={[
                styles.skeleton,
                {
                  height: 18,
                  width: 150,
                  marginBottom: 6,
                  opacity: animatedValue,
                  backgroundColor: isDark ? "#333" : "#E1E9EE",
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeleton,
                {
                  height: 14,
                  width: 200,
                  opacity: animatedValue,
                  backgroundColor: isDark ? "#333" : "#E1E9EE",
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.popQuizQuestion}>
          <Animated.View
            style={[
              styles.skeleton,
              {
                height: 12,
                width: 100,
                marginBottom: 4,
                opacity: animatedValue,
                backgroundColor: isDark ? "#333" : "#E1E9EE",
              },
            ]}
          />
          <Animated.View
            style={[
              styles.skeleton,
              {
                height: 20,
                width: 120,
                opacity: animatedValue,
                backgroundColor: isDark ? "#333" : "#E1E9EE",
              },
            ]}
          />
        </View>

        <View style={styles.popQuizOptions}>
          {[1, 2, 3, 4].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.skeleton,
                {
                  height: 48,
                  borderRadius: 12,
                  opacity: animatedValue,
                  backgroundColor: isDark ? "#2c2c2e" : "#fff", // Card background
                  borderWidth: 1,
                  borderColor: isDark ? "#333" : "#E1E9EE",
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  skeleton: {
    borderRadius: 4,
  },
  titleSkeleton: {
    height: 24,
    width: 100,
    marginBottom: 16,
  },
  popQuizCard: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  popQuizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  popQuizQuestion: {
    gap: 4,
  },
  popQuizOptions: {
    gap: 8,
  },
});
