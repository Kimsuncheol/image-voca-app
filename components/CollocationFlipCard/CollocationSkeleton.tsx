import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { styles } from "./EnglishCollocationCardStyle";

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
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonFace}>
        {/* Accent Mark Placeholder */}
        <Animated.View
          style={[
            styles.skeletonBase,
            styles.skeletonAccentMark,
            { opacity: animatedValue },
          ]}
        />

        <View style={styles.skeletonContentContainer}>
          {/* Collocation Text Placeholder */}
          <Animated.View
            style={[
              styles.skeletonBase,
              styles.skeletonCollocation,
              { opacity: animatedValue },
            ]}
          />
          {/* Meaning Text Placeholder */}
          <Animated.View
            style={[
              styles.skeletonBase,
              styles.skeletonMeaning,
              { opacity: animatedValue },
            ]}
          />
        </View>

        <View style={styles.skeletonFooter}>
          {/* Indicator Placeholder */}
          <Animated.View
            style={[
              styles.skeletonBase,
              styles.skeletonIndicator,
              { opacity: animatedValue },
            ]}
          />
        </View>
      </View>
    </View>
  );
}


