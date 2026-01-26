import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function CollocationSkeleton() {
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
    <View style={styles.card}>
      <View style={styles.face}>
        {/* Accent Mark Placeholder */}
        <Animated.View
          style={[
            styles.skeleton,
            styles.accentMark,
            { opacity: animatedValue },
          ]}
        />

        <View style={styles.contentContainer}>
          {/* Collocation Text Placeholder */}
          <Animated.View
            style={[
              styles.skeleton,
              styles.collocationSkeleton,
              { opacity: animatedValue },
            ]}
          />
          {/* Meaning Text Placeholder */}
          <Animated.View
            style={[
              styles.skeleton,
              styles.meaningSkeleton,
              { opacity: animatedValue },
            ]}
          />
        </View>

        <View style={styles.footer}>
          {/* Indicator Placeholder */}
          <Animated.View
            style={[
              styles.skeleton,
              styles.indicatorSkeleton,
              { opacity: animatedValue },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 480,
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "transparent",
  },
  face: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  skeleton: {
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
  accentMark: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 6,
    height: 24,
    borderRadius: 3,
    transform: [{ rotate: "15deg" }],
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  collocationSkeleton: {
    width: "80%",
    height: 48, // Approx line height of collocation text
    marginBottom: 24,
    borderRadius: 8,
  },
  meaningSkeleton: {
    width: "60%",
    height: 28, // Approx line height of meaning text
    borderRadius: 6,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 0,
  },
  indicatorSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
