import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface VocabularyEmptyStateProps {
  isDark: boolean;
}

export const VocabularyEmptyState: React.FC<VocabularyEmptyStateProps> = ({
  isDark,
}) => {
  return (
    <View style={styles.container}>
      <Text style={{ color: isDark ? "#fff" : "#000" }}>
        No words found for this day.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
