import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { CourseType } from "../../../src/types/vocabulary";
import CollocationSkeleton from "../../CollocationFlipCard/CollocationSkeleton";
import { VocabularyCardSkeleton } from "../../swipe/VocabularyCardSkeleton";

const { width, height } = Dimensions.get("window");

interface VocabularyLoadingSkeletonProps {
  courseId: CourseType;
}

export const VocabularyLoadingSkeleton: React.FC<
  VocabularyLoadingSkeletonProps
> = ({ courseId }) => {
  return (
    <View style={styles.swipeContainer}>
      {courseId === "COLLOCATION" ? (
        <CollocationSkeleton />
      ) : (
        <VocabularyCardSkeleton />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    height: height * 0.8,
    width: width,
    alignItems: "center",
    justifyContent: "center",
  },
});
