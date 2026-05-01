import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { JLPTLevelCourse } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";

interface JlptLevelCardProps {
  level: JLPTLevelCourse;
  onPress: () => void;
}

export function JlptLevelCard({
  level,
  onPress,
}: JlptLevelCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.badge,
          { backgroundColor: `${level.color}20`, borderColor: level.color },
        ]}
      >
        <ThemedText style={[styles.badgeText, { color: level.color }]}>
          {t(level.titleKey, { defaultValue: level.title })}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="subtitle">
          {t(level.titleKey, { defaultValue: level.title })}
        </ThemedText>
        <ThemedText style={styles.description}>
          {t(level.descriptionKey, { defaultValue: level.description })}
        </ThemedText>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? "#666" : "#999"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    minHeight: 92,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginRight: 16,
  },
  badgeText: {
    fontSize: FontSizes.titleLg,
    fontWeight: FontWeights.extraBold,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: FontSizes.label,
    opacity: 0.65,
    marginTop: 3,
  },
});
