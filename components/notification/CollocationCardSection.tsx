import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { NotificationCollocationCardPayload } from "../../src/types/notificationCard";
import { resolveVocabularyContent } from "../../src/utils/localizedVocabulary";
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
  const { i18n } = useTranslation();
  const resolved = React.useMemo(
    () => resolveVocabularyContent(payload, i18n.language),
    [i18n.language, payload],
  );

  return (
    <View style={styles.container}>
      <CollocationFlipCard
        isDark={isDark}
        isActive={true}
        data={{
          collocation: resolved.word,
          meaning: resolved.meaning,
          explanation: resolved.localizedPronunciation ?? "",
          example: resolved.example,
          translation: resolved.translation ?? "",
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
