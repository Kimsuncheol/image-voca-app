import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useSubscriptionStore } from "../../src/stores";
import { COURSES } from "../../src/types/vocabulary";

export default function ReviewScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { canAccessSpeaking, fetchSubscription } = useSubscriptionStore();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSubscription(user.uid);
      }
    }, [fetchSubscription, user])
  );

  const handleCoursePress = (courseId: string) => {
    if (courseId === "TOEIC_SPEAKING" && !canAccessSpeaking()) {
      Alert.alert(
        t("alerts.premiumFeature.title"),
        t("alerts.premiumFeature.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("common.upgrade"), onPress: () => router.push("/billing") },
        ]
      );
      return;
    }

    router.push({
      pathname: "/review/[courseId]",
      params: { courseId },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: t("review.title"),
          headerBackTitle: t("common.back"),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title">{t("review.reviewWords")}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("review.selectCourse")}
          </ThemedText>
        </View>

        <View style={styles.courseGrid}>
          {COURSES.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseCard,
                { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
              ]}
              onPress={() => handleCoursePress(course.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: course.color + "20" },
                ]}
              >
                <Ionicons
                  name={course.icon as any}
                  size={32}
                  color={course.color}
                />
              </View>
              <ThemedText type="subtitle" style={styles.courseTitle}>
                {t(course.titleKey, { defaultValue: course.title })}
              </ThemedText>
              <ThemedText style={styles.courseDescription}>
                {t(course.descriptionKey, { defaultValue: course.description })}
              </ThemedText>
            </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 4,
  },
  courseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  courseCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 16,
    textAlign: "center",
  },
  courseDescription: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
  },
});
