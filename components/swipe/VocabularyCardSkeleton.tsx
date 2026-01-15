import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width } = Dimensions.get("window");

export function VocabularyCardSkeleton() {
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
    <View style={styles.card}>
      {/* Image Placeholder */}
      <View style={styles.imagePlaceholder}>
        <Animated.View
          style={[
            styles.skeleton,
            { opacity: animatedValue, height: "100%", width: "100%" },
          ]}
        />
      </View>

      {/* Info Placeholder */}
      <View style={styles.cardInfo}>
        {/* Title & icon */}
        <View style={styles.titleRow}>
          <Animated.View
            style={[
              styles.skeleton,
              styles.titleSkeleton,
              { opacity: animatedValue },
            ]}
          />
          <Animated.View
            style={[
              styles.skeleton,
              styles.iconSkeleton,
              { opacity: animatedValue },
            ]}
          />
        </View>

        {/* Pronunciation */}
        <Animated.View
          style={[
            styles.skeleton,
            styles.textSkeleton,
            { width: "40%", opacity: animatedValue },
          ]}
        />

        {/* Meaning (2 lines) */}
        <Animated.View
          style={[
            styles.skeleton,
            styles.textSkeleton,
            { width: "90%", marginTop: 20, opacity: animatedValue },
          ]}
        />
        <Animated.View
          style={[
            styles.skeleton,
            styles.textSkeleton,
            { width: "80%", opacity: animatedValue },
          ]}
        />

        {/* Example */}
        <Animated.View
          style={[
            styles.skeleton,
            styles.textSkeleton,
            { width: "85%", marginTop: 20, opacity: animatedValue },
          ]}
        />

        {/* Button */}
        <Animated.View
          style={[
            styles.skeleton,
            styles.buttonSkeleton,
            { opacity: animatedValue },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "90%", // Match swipe card height visually or use hardcoded height if needed. SwipeCardItem uses 100% of parent.
    // But SwipeContainer in vocabulary.tsx is 70% of screen height.
    // SwipeCardItem styles say height: "100%", width: width * 0.9
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  skeleton: {
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
  imagePlaceholder: {
    height: "50%",
    width: "100%",
    backgroundColor: "#F0F0F0",
  },
  cardInfo: {
    height: "50%",
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleSkeleton: {
    height: 30,
    width: "60%",
    borderRadius: 6,
  },
  iconSkeleton: {
    height: 24,
    width: 24,
    borderRadius: 12,
  },
  textSkeleton: {
    height: 16,
    marginBottom: 8,
  },
  buttonSkeleton: {
    height: 40,
    width: 140,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: "flex-start",
  },
});
