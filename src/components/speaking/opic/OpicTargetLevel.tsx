import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../../components/themed-text";
import { OPIcLevel } from "../../../services/aiSpeakingService";

export const OPIC_LEVELS: { id: OPIcLevel; color: string }[] = [
  { id: "IL", color: "#dc3545" },
  { id: "IM1", color: "#fd7e14" },
  { id: "IM2", color: "#ffc107" },
  { id: "IM3", color: "#20c997" },
  { id: "IH", color: "#28a745" },
  { id: "AL", color: "#007bff" },
];

interface OpicTargetLevelProps {
  targetLevel: OPIcLevel;
  onSelectLevel: (level: OPIcLevel) => void;
  isDark: boolean;
}

export function OpicTargetLevel({
  targetLevel,
  onSelectLevel,
  isDark,
}: OpicTargetLevelProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("speaking.opic.targetLevel")}
      </ThemedText>
      <View style={styles.levelsContainer}>
        {OPIC_LEVELS.map((level) => {
          const isSelected = targetLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelButton,
                {
                  backgroundColor: isSelected
                    ? level.color
                    : isDark
                      ? "#1c1c1e"
                      : "#f5f5f5",
                },
              ]}
              onPress={() => onSelectLevel(level.id)}
            >
              <ThemedText
                style={[
                  styles.levelText,
                  { color: isSelected ? "#fff" : isDark ? "#fff" : "#333" },
                ]}
              >
                {level.id}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  levelsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  levelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  levelText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
