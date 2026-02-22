import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../../components/themed-text";
import { TOEIC_SPEAKING_PARTS } from "../../../services/aiSpeakingService";

interface ToeicPartsListProps {
  selectedParts: number[];
  onTogglePart: (part: number) => void;
  isDark: boolean;
}

export function ToeicPartsList({
  selectedParts,
  onTogglePart,
  isDark,
}: ToeicPartsListProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.partsContainer}>
      {TOEIC_SPEAKING_PARTS.map((part) => {
        const isSelected = selectedParts.includes(part.part);
        return (
          <TouchableOpacity
            key={part.part}
            style={[
              styles.partCard,
              {
                backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5",
                borderColor: isSelected ? "#4ECDC4" : "transparent",
                borderWidth: 2,
              },
            ]}
            onPress={() => onTogglePart(part.part)}
            activeOpacity={0.7}
          >
            <View style={styles.partHeader}>
              <View
                style={[
                  styles.partBadge,
                  {
                    backgroundColor: isSelected
                      ? "#4ECDC4"
                      : isDark
                        ? "#333"
                        : "#ddd",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.partNumber,
                    {
                      color: isSelected ? "#fff" : isDark ? "#fff" : "#333",
                    },
                  ]}
                >
                  {part.part}
                </ThemedText>
              </View>
              <View style={styles.partInfo}>
                <ThemedText type="subtitle" style={styles.partTitle}>
                  {t(`speaking.toeic.parts.${part.part}.title`)}
                </ThemedText>
                <ThemedText style={styles.partDescription}>
                  {t(`speaking.toeic.parts.${part.part}.description`)}
                </ThemedText>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
              )}
            </View>

            <View style={styles.partTimes}>
              <View style={styles.timeItem}>
                <Ionicons
                  name="hourglass-outline"
                  size={14}
                  color={isDark ? "#888" : "#666"}
                />
                <ThemedText style={styles.timeText}>
                  {t("speaking.toeic.prepTime", { time: part.prepTime })}
                </ThemedText>
              </View>
              <View style={styles.timeItem}>
                <Ionicons
                  name="mic-outline"
                  size={14}
                  color={isDark ? "#888" : "#666"}
                />
                <ThemedText style={styles.timeText}>
                  {t("speaking.toeic.responseTime", {
                    time: part.responseTime,
                  })}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  partsContainer: {
    gap: 12,
  },
  partCard: {
    padding: 16,
    borderRadius: 12,
  },
  partHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  partBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  partNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  partInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  partDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
  partTimes: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
