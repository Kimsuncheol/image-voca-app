import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Loading View Component
 * Displays a centered loading spinner while data is being fetched
 */
export function LoadingView() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
});
