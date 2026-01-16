import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../../components/themed-text";
import { useTheme } from "../../../src/context/ThemeContext";
import { TOEIC_SPEAKING_PARTS } from "../../../src/services/aiSpeakingService";

export default function TOEICIndexScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedParts, setSelectedParts] = useState<number[]>([]);

  const togglePart = (part: number) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const selectAll = () => {
    if (selectedParts.length === TOEIC_SPEAKING_PARTS.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(TOEIC_SPEAKING_PARTS.map((p) => p.part));
    }
  };

  const startPractice = () => {
    if (selectedParts.length === 0) return;

    router.push({
      pathname: "/speaking/toeic/practice",
      params: { parts: selectedParts.join(",") },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {t("speaking.toeic.selectParts")}
          </ThemedText>
          <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
            <ThemedText style={styles.selectAllText}>
              {selectedParts.length === TOEIC_SPEAKING_PARTS.length
                ? t("common.deselectAll")
                : t("common.selectAll")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Parts List */}
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
                onPress={() => togglePart(part.part)}
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
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4ECDC4"
                    />
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
      </ScrollView>

      {/* Start Button */}
      <View
        style={[
          styles.footer,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor:
                selectedParts.length > 0 ? "#4ECDC4" : isDark ? "#333" : "#ddd",
            },
          ]}
          onPress={startPractice}
          disabled={selectedParts.length === 0}
        >
          <Ionicons name="play" size={20} color="#fff" />
          <ThemedText style={styles.startButtonText}>
            {selectedParts.length > 0
              ? t("speaking.toeic.startPractice", {
                  count: selectedParts.length,
                })
              : t("speaking.toeic.selectToStart")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
  },
  selectAllBtn: {
    padding: 8,
  },
  selectAllText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "600",
  },
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
