/**
 * Student Profile Screen (Teacher View)
 *
 * Deep dive into individual student's progress, statistics, and course completion
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { useSubscriptionStore } from "../../../../src/stores/subscriptionStore";
import { getStudentAnalytics } from "../../../../src/services/teacherAnalyticsService";
import type { StudentAnalytics } from "../../../../src/types/teacher";

export default function StudentProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { studentId } = useLocalSearchParams<{ studentId: string }>();

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);

  useEffect(() => {
    checkTeacherRole();
  }, []);

  useEffect(() => {
    if (!checkingRole && isTeacher()) {
      loadStudentData();
    }
  }, [checkingRole, studentId]);

  const checkTeacherRole = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    setCheckingRole(false);
  };

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const data = await getStudentAnalytics(studentId);
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudentData();
    setRefreshing(false);
  };

  // Loading state
  if (checkingRole) {
    return (
      <View style={[styles.loading, isDark && styles.loadingDark]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Permission denied state
  if (!isTeacher()) {
    return (
      <View style={[styles.denied, isDark && styles.deniedDark]}>
        <Ionicons name="lock-closed" size={64} color="#999" />
        <Text style={[styles.deniedText, isDark && styles.deniedTextDark]}>
          {t("teacher.permission.denied")}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>{t("common.goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content
  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : !analytics ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color="#999" />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {t("teacher.studentProfile.notFound")}
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Student Header */}
            <View style={[styles.header, isDark && styles.headerDark]}>
              {analytics.photoURL ? (
                <Image
                  source={{ uri: analytics.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {getInitials(analytics.displayName)}
                  </Text>
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text
                  style={[styles.studentName, isDark && styles.studentNameDark]}
                >
                  {analytics.displayName || "Unknown"}
                </Text>
                {analytics.email && (
                  <Text style={[styles.email, isDark && styles.emailDark]}>
                    {analytics.email}
                  </Text>
                )}
              </View>
            </View>

            {/* Key Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Ionicons name="book" size={24} color="#007AFF" />
                <Text
                  style={[styles.statValue, isDark && styles.statValueDark]}
                >
                  {analytics.totalWordsLearned}
                </Text>
                <Text
                  style={[styles.statLabel, isDark && styles.statLabelDark]}
                >
                  {t("teacher.analytics.wordsLearned")}
                </Text>
              </View>

              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Ionicons name="flame" size={24} color="#FF6B35" />
                <Text
                  style={[styles.statValue, isDark && styles.statValueDark]}
                >
                  {analytics.currentStreak}
                </Text>
                <Text
                  style={[styles.statLabel, isDark && styles.statLabelDark]}
                >
                  {t("teacher.analytics.currentStreak")}
                </Text>
              </View>

              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Ionicons name="timer" size={24} color="#4CAF50" />
                <Text
                  style={[styles.statValue, isDark && styles.statValueDark]}
                >
                  {analytics.totalTimeSpent}
                </Text>
                <Text
                  style={[styles.statLabel, isDark && styles.statLabelDark]}
                >
                  {t("teacher.analytics.minutes")}
                </Text>
              </View>

              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Ionicons name="trending-up" size={24} color="#9C27B0" />
                <Text
                  style={[styles.statValue, isDark && styles.statValueDark]}
                >
                  {Math.round(analytics.avgAccuracy)}%
                </Text>
                <Text
                  style={[styles.statLabel, isDark && styles.statLabelDark]}
                >
                  {t("teacher.analytics.accuracy")}
                </Text>
              </View>
            </View>

            {/* Streak Info */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text
                style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
              >
                {t("teacher.studentProfile.streakInfo")}
              </Text>
              <View style={styles.streakRow}>
                <View style={styles.streakItem}>
                  <Text
                    style={[
                      styles.streakValue,
                      isDark && styles.streakValueDark,
                    ]}
                  >
                    {analytics.currentStreak}
                  </Text>
                  <Text
                    style={[
                      styles.streakLabel,
                      isDark && styles.streakLabelDark,
                    ]}
                  >
                    {t("teacher.analytics.currentStreak")}
                  </Text>
                </View>
                <View style={styles.streakDivider} />
                <View style={styles.streakItem}>
                  <Text
                    style={[
                      styles.streakValue,
                      isDark && styles.streakValueDark,
                    ]}
                  >
                    {analytics.longestStreak}
                  </Text>
                  <Text
                    style={[
                      styles.streakLabel,
                      isDark && styles.streakLabelDark,
                    ]}
                  >
                    {t("teacher.analytics.longestStreak")}
                  </Text>
                </View>
                <View style={styles.streakDivider} />
                <View style={styles.streakItem}>
                  <Text
                    style={[
                      styles.streakValue,
                      isDark && styles.streakValueDark,
                    ]}
                  >
                    {analytics.daysCompleted}
                  </Text>
                  <Text
                    style={[
                      styles.streakLabel,
                      isDark && styles.streakLabelDark,
                    ]}
                  >
                    {t("teacher.analytics.daysCompleted")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Course Progress */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text
                style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
              >
                {t("teacher.studentProfile.courseProgress")}
              </Text>
              {Object.keys(analytics.courseProgress || {}).length === 0 ? (
                <Text
                  style={[
                    styles.noCourses,
                    isDark && styles.noCoursesTextDark,
                  ]}
                >
                  {t("teacher.studentProfile.noCourses")}
                </Text>
              ) : (
                Object.entries(analytics.courseProgress || {}).map(
                  ([courseId, days]) => {
                    const completedDays = Object.values(days).filter(
                      (day: any) => day.completedVocabulary
                    ).length;
                    const totalDays = Object.keys(days).length;
                    const percentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

                    return (
                      <View key={courseId} style={styles.courseItem}>
                        <View style={styles.courseHeader}>
                          <Text
                            style={[
                              styles.courseName,
                              isDark && styles.courseNameDark,
                            ]}
                          >
                            {courseId}
                          </Text>
                          <Text
                            style={[
                              styles.courseProgress,
                              isDark && styles.courseProgressDark,
                            ]}
                          >
                            {completedDays}/{totalDays} days
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.progressBar,
                            isDark && styles.progressBarDark,
                          ]}
                        >
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  }
                )
              )}
            </View>

            {/* Recent Activity */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text
                style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
              >
                {t("teacher.studentProfile.recentActivity")}
              </Text>
              {!analytics.activityTrend ||
              analytics.activityTrend.length === 0 ? (
                <Text
                  style={[
                    styles.noActivity,
                    isDark && styles.noActivityTextDark,
                  ]}
                >
                  {t("teacher.studentProfile.noActivity")}
                </Text>
              ) : (
                analytics.activityTrend
                  .slice(0, 7)
                  .map((activity, index) => (
                    <View key={index} style={styles.activityItem}>
                      <View style={styles.activityLeft}>
                        <Text
                          style={[
                            styles.activityDate,
                            isDark && styles.activityDateDark,
                          ]}
                        >
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                      <View style={styles.activityRight}>
                        <View style={styles.activityMetric}>
                          <Ionicons
                            name="book-outline"
                            size={14}
                            color="#666"
                          />
                          <Text
                            style={[
                              styles.activityValue,
                              isDark && styles.activityValueDark,
                            ]}
                          >
                            {activity.wordsLearned} words
                          </Text>
                        </View>
                        <View style={styles.activityMetric}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#666"
                          />
                          <Text
                            style={[
                              styles.activityValue,
                              isDark && styles.activityValueDark,
                            ]}
                          >
                            {activity.timeSpent} min
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (
    (parts[0][0]?.toUpperCase() || "") + (parts[1][0]?.toUpperCase() || "")
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingDark: {
    backgroundColor: "#000",
  },
  denied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  deniedDark: {
    backgroundColor: "#000",
  },
  deniedText: {
    fontSize: 18,
    color: "#333",
    marginTop: 16,
    marginBottom: 24,
  },
  deniedTextDark: {
    color: "#FFF",
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyTextDark: {
    color: "#999",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerDark: {
    backgroundColor: "#1C1C1E",
    shadowColor: "#FFF",
    shadowOpacity: 0.05,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#FFF",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  studentName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  studentNameDark: {
    color: "#FFF",
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  emailDark: {
    color: "#999",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    margin: "1%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardDark: {
    backgroundColor: "#1C1C1E",
    shadowColor: "#FFF",
    shadowOpacity: 0.05,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
  },
  statValueDark: {
    color: "#FFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  statLabelDark: {
    color: "#999",
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionDark: {
    backgroundColor: "#1C1C1E",
    shadowColor: "#FFF",
    shadowOpacity: 0.05,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: "#FFF",
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  streakItem: {
    alignItems: "center",
  },
  streakValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#007AFF",
  },
  streakValueDark: {
    color: "#0A84FF",
  },
  streakLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  streakLabelDark: {
    color: "#999",
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  noCourses: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 16,
  },
  noCoursesTextDark: {
    color: "#999",
  },
  courseItem: {
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  courseNameDark: {
    color: "#FFF",
  },
  courseProgress: {
    fontSize: 14,
    color: "#666",
  },
  courseProgressDark: {
    color: "#999",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarDark: {
    backgroundColor: "#333",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  noActivity: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 16,
  },
  noActivityTextDark: {
    color: "#999",
  },
  activityItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  activityLeft: {
    width: 80,
  },
  activityDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  activityDateDark: {
    color: "#FFF",
  },
  activityRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  activityMetric: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityValue: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  activityValueDark: {
    color: "#999",
  },
});
