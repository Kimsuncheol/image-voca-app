import React from "react";
import { StyleSheet, View } from "react-native";
import type { NotificationCollocationCardPayload } from "../../src/types/notificationCard";
import CollocationFlipCard from "../CollocationFlipCard";

interface CollocationCardSectionProps {
  payload: NotificationCollocationCardPayload;
  isDark: boolean;
}

/**
 * Renders the collocation flip card for a collocation-kind notification.
 * Maps the flat notification payload fields to the shape expected by CollocationFlipCard.
 */
export default function CollocationCardSection({
  payload,
  isDark,
}: CollocationCardSectionProps) {
  return (
    <View style={styles.container}>
      <CollocationFlipCard
        isDark={isDark}
        isActive={true}
        data={{
          collocation: payload.word,
          meaning: payload.meaning,
          explanation: payload.pronunciation ?? "",
          example: payload.example ?? "",
          translation: payload.translation ?? "",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
});
