import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemCardInfoSection } from "./SwipeCardItemCardInfoSection";
import { SwipeCardItemImageSection } from "./SwipeCardItemImageSection";

const { width } = Dimensions.get("window");

interface SwipeCardItemProps {
  item: VocabularyCard;
  initialIsSaved?: boolean;
  day?: number;
}

export function SwipeCardItem({
  item,
  initialIsSaved = false,
  day,
}: SwipeCardItemProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        { borderColor: isDark ? "#333" : "#E0E0E0" },
      ]}
    >
      {/* Image Section */}
      <SwipeCardItemImageSection image={item.image} isDark={isDark} />

      {/* Card Info Section */}
      <SwipeCardItemCardInfoSection
        item={item}
        isDark={isDark}
        initialIsSaved={initialIsSaved}
        day={day}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
});
