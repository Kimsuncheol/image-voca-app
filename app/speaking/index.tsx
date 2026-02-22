import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../components/themed-text";
import { useTheme } from "../../src/context/ThemeContext";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";

interface ExamOption {
  id: "toeic" | "opic";
  titleKey: string;
  descriptionKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    id: "toeic",
    titleKey: "speaking.toeic.title",
    descriptionKey: "speaking.toeic.description",
    icon: "briefcase",
    color: "#4ECDC4",
    route: "/speaking/toeic",
  },
  {
    id: "opic",
    titleKey: "speaking.opic.title",
    descriptionKey: "speaking.opic.description",
    icon: "chatbubbles",
    color: "#87CEEB",
    route: "/speaking/opic",
  },
];

export default function SpeakingIndexScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { canAccessSpeaking } = useSubscriptionStore();

  const handleSelectExam = (exam: ExamOption) => {
    if (!canAccessSpeaking()) {
      Alert.alert(t("speaking.locked.title"), t("speaking.locked.message"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("speaking.locked.upgrade"),
          onPress: () => router.push("/billing/subscription"),
        },
      ]);
      return;
    }
    router.push(exam.route);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["left", "right", "top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="mic"
            size={48}
            color={isDark ? "#4ECDC4" : "#007AFF"}
          />
          <ThemedText type="title" style={styles.headerTitle}>
            {t("speaking.header.title")}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {t("speaking.header.subtitle")}
          </ThemedText>
        </View>

        {/* Exam Options */}
        <View style={styles.optionsContainer}>
          {EXAM_OPTIONS.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={[
                styles.examCard,
                {
                  backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5",
                  borderLeftColor: exam.color,
                },
              ]}
              onPress={() => handleSelectExam(exam)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${exam.color}20` },
                ]}
              >
                <Ionicons name={exam.icon} size={32} color={exam.color} />
              </View>
              <View style={styles.examContent}>
                <ThemedText type="subtitle" style={styles.examTitle}>
                  {t(exam.titleKey)}
                </ThemedText>
                <ThemedText style={styles.examDescription}>
                  {t(exam.descriptionKey)}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? "#666" : "#999"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscription Notice */}
        {!canAccessSpeaking() && (
          <View
            style={[
              styles.notice,
              { backgroundColor: isDark ? "#2c2c2e" : "#fff3cd" },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={20}
              color={isDark ? "#ffc107" : "#856404"}
            />
            <ThemedText
              style={[
                styles.noticeText,
                { color: isDark ? "#ffc107" : "#856404" },
              ]}
            >
              {t("speaking.notice.premium")}
            </ThemedText>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresContainer}>
          <ThemedText type="subtitle" style={styles.featuresTitle}>
            {t("speaking.features.title")}
          </ThemedText>
          {[
            { icon: "mic-outline", textKey: "speaking.features.aiAnalysis" },
            { icon: "stats-chart", textKey: "speaking.features.scoring" },
            { icon: "bulb-outline", textKey: "speaking.features.feedback" },
            {
              icon: "time-outline",
              textKey: "speaking.features.timedPractice",
            },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons
                name={feature.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={isDark ? "#4ECDC4" : "#007AFF"}
              />
              <ThemedText style={styles.featureText}>
                {t(feature.textKey)}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
  },
  headerTitle: {
    marginTop: 16,
    fontSize: 28,
    textAlign: "center",
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  examContent: {
    flex: 1,
    marginLeft: 16,
  },
  examTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  examDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
  },
  featuresContainer: {
    padding: 20,
    gap: 16,
  },
  featuresTitle: {
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    opacity: 0.8,
  },
});
