import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../../components/themed-text";
import { OPIC_TOPICS } from "../../../services/aiSpeakingService";

interface OpicTopicsListProps {
  selectedTopics: string[];
  onToggleTopic: (topicId: string) => void;
  isDark: boolean;
}

export function OpicTopicsList({
  selectedTopics,
  onToggleTopic,
  isDark,
}: OpicTopicsListProps) {
  const { t } = useTranslation();

  return (
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
              onPress={() => onToggleTopic(topic.id)}
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
                <Ionicons name="checkmark-circle" size={24} color="#87CEEB" />
              )}
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
});
