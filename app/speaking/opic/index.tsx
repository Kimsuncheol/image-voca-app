import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../../components/themed-text";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  OPIC_TOPICS,
  OPIcLevel,
} from "../../../src/services/aiSpeakingService";

const LEVELS: { id: OPIcLevel; color: string }[] = [
  { id: "IL", color: "#dc3545" },
  { id: "IM1", color: "#fd7e14" },
  { id: "IM2", color: "#ffc107" },
  { id: "IM3", color: "#20c997" },
  { id: "IH", color: "#28a745" },
  { id: "AL", color: "#007bff" },
];

export default function OPIcIndexScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [targetLevel, setTargetLevel] = useState<OPIcLevel>("IM2");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const startPractice = () => {
    if (selectedTopics.length === 0) return;

    router.push({
      pathname: "/speaking/opic/practice",
      params: {
        level: targetLevel,
        topics: selectedTopics.join(","),
      },
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
        {/* Target Level Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t("speaking.opic.targetLevel")}
          </ThemedText>
          <View style={styles.levelsContainer}>
            {LEVELS.map((level) => {
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
                  onPress={() => setTargetLevel(level.id)}
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

        {/* Topic Selection */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t("speaking.opic.selectTopics")}
          </ThemedText>
          <View style={styles.topicsContainer}>
            {OPIC_TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    {
                      backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5",
                      borderColor: isSelected ? "#87CEEB" : "transparent",
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => toggleTopic(topic.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicContent}>
                    <ThemedText type="subtitle" style={styles.topicTitle}>
                      {t(topic.titleKey)}
                    </ThemedText>
                    <ThemedText style={styles.topicQuestions}>
                      {t("speaking.opic.questionsCount", {
                        count: topic.questions.length,
                      })}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#87CEEB"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
                selectedTopics.length > 0
                  ? "#87CEEB"
                  : isDark
                  ? "#333"
                  : "#ddd",
            },
          ]}
          onPress={startPractice}
          disabled={selectedTopics.length === 0}
        >
          <Ionicons name="play" size={20} color="#fff" />
          <ThemedText style={styles.startButtonText}>
            {selectedTopics.length > 0
              ? t("speaking.opic.startPractice", {
                  count: selectedTopics.length,
                })
              : t("speaking.opic.selectToStart")}
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
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  topicQuestions: {
    fontSize: 13,
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
