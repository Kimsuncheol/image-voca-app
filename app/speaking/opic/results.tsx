import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../../components/themed-text";
import { useTheme } from "../../../src/context/ThemeContext";
import { useSpeakingTutorStore } from "../../../src/stores/speakingTutorStore";

const LEVEL_COLORS: Record<string, string> = {
  IL: "#dc3545",
  IM1: "#fd7e14",
  IM2: "#ffc107",
  IM3: "#20c997",
  IH: "#28a745",
  AL: "#007bff",
};

export default function OPIcResultsScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { currentSession, resetSession } = useSpeakingTutorStore();

  if (!currentSession) {
    return null;
  }

  const predictedLevel = currentSession.predictedLevel || "IM2";
  const levelColor = LEVEL_COLORS[predictedLevel] || "#87CEEB";

  const handleRetry = () => {
    resetSession();
    router.replace("/speaking/opic");
  };

  const handleFinish = () => {
    resetSession();
    router.replace("/speaking");
  };

  const getScoreBarWidth = (score: number): `${number}%` =>
    `${(score / 5) * 100}%`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Predicted Level */}
        <View style={styles.levelContainer}>
          <ThemedText style={styles.levelLabel}>
            {t("speaking.opic.predictedLevel")}
          </ThemedText>
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <ThemedText style={styles.levelText}>{predictedLevel}</ThemedText>
          </View>
          <ThemedText style={styles.levelDescription}>
            {t(`speaking.opic.levels.${predictedLevel}`)}
          </ThemedText>
        </View>

        {/* Feedback Cards */}
        {currentSession.feedbacks.map((feedback, index) => (
          <View
            key={index}
            style={[
              styles.feedbackCard,
              { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <ThemedText type="subtitle" style={styles.questionTitle}>
                {t("speaking.results.question", { num: index + 1 })}
              </ThemedText>
            </View>

            {/* Category Scores */}
            <View style={styles.categoriesContainer}>
              {[
                {
                  key: "pronunciation",
                  label: t("speaking.categories.pronunciation"),
                },
                { key: "fluency", label: t("speaking.categories.fluency") },
                { key: "grammar", label: t("speaking.categories.grammar") },
                {
                  key: "vocabulary",
                  label: t("speaking.categories.vocabulary"),
                },
                { key: "content", label: t("speaking.categories.content") },
              ].map((cat) => (
                <View key={cat.key} style={styles.categoryRow}>
                  <ThemedText style={styles.categoryLabel}>
                    {cat.label}
                  </ThemedText>
                  <View
                    style={[
                      styles.categoryBar,
                      { backgroundColor: isDark ? "#333" : "#ddd" },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryFill,
                        {
                          width: getScoreBarWidth(
                            feedback[cat.key as keyof typeof feedback] as number
                          ),
                          backgroundColor: "#87CEEB",
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.categoryScore}>
                    {feedback[cat.key as keyof typeof feedback]}/5
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Transcription */}
            {feedback.transcription && (
              <View style={styles.transcriptionContainer}>
                <ThemedText style={styles.sectionTitle}>
                  {t("speaking.results.yourResponse")}
                </ThemedText>
                <ThemedText style={styles.transcriptionText}>
                  {`"${feedback.transcription}"`}
                </ThemedText>
              </View>
            )}

            {/* Strengths */}
            {feedback.strengths.length > 0 && (
              <View style={styles.feedbackSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={18} color="#28a745" />
                  <ThemedText style={styles.sectionTitle}>
                    {t("speaking.results.strengths")}
                  </ThemedText>
                </View>
                {feedback.strengths.map((strength, i) => (
                  <ThemedText key={i} style={styles.bulletPoint}>
                    • {strength}
                  </ThemedText>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {feedback.suggestions.length > 0 && (
              <View style={styles.feedbackSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bulb" size={18} color="#ffc107" />
                  <ThemedText style={styles.sectionTitle}>
                    {t("speaking.results.suggestions")}
                  </ThemedText>
                </View>
                {feedback.suggestions.map((suggestion, i) => (
                  <ThemedText key={i} style={styles.bulletPoint}>
                    • {suggestion}
                  </ThemedText>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.footer,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <TouchableOpacity
          style={[styles.footerButton, styles.retryButton]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <ThemedText style={styles.footerButtonText}>
            {t("common.retry")}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.finishButton]}
          onPress={handleFinish}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <ThemedText style={styles.footerButtonText}>
            {t("common.finish")}
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
    paddingBottom: 120,
  },
  levelContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  levelLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  levelText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  levelDescription: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
  feedbackCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  feedbackHeader: {
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 16,
  },
  categoriesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryLabel: {
    width: 100,
    fontSize: 13,
    opacity: 0.8,
  },
  categoryBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  categoryFill: {
    height: "100%",
    borderRadius: 4,
  },
  categoryScore: {
    width: 30,
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
  },
  transcriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#33333333",
  },
  transcriptionText: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
    marginTop: 8,
    lineHeight: 22,
  },
  feedbackSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  bulletPoint: {
    fontSize: 14,
    opacity: 0.8,
    marginLeft: 26,
    marginBottom: 4,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    paddingBottom: 34,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    backgroundColor: "#666",
  },
  finishButton: {
    backgroundColor: "#87CEEB",
  },
  footerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
