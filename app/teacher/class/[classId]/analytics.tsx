/**
 * Class Analytics Screen
 *
 * Shows analytics dashboard for a class including:
 * - Overall metrics (active students, avg performance)
 * - Trend charts
 * - Top performers
 * - Students needing attention
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getClassAnalytics } from "../../../../src/services/teacherAnalyticsService";
import { useSubscriptionStore } from "../../../../src/stores/subscriptionStore";
import { useTeacherStore } from "../../../../src/stores/teacherStore";
import { ClassAnalytics } from "../../../../src/types/teacher";

export default function ClassAnalyticsScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const { currentClass, fetchClassDetails } = useTeacherStore();

  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");

  const styles = getStyles(isDark);

  // Check teacher role
  useEffect(() => {
    const checkRole = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCheckingRole(false);
    };
    checkRole();
  }, []);

  // Load class and analytics
  useEffect(() => {
    if (classId && isTeacher() && !checkingRole) {
      loadData();
    }
  }, [classId, checkingRole, period]);

  const loadData = async () => {
    if (!classId) return;

    try {
      setError(null);
      // Load class details if needed
      if (!currentClass || currentClass.id !== classId) {
        await fetchClassDetails(classId);
      }
      // Load analytics
      const classAnalytics = await getClassAnalytics(classId, period);
      setAnalytics(classAnalytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load analytics",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Loading state while checking role
  if (checkingRole) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Access denied screen
  if (!isTeacher()) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <Ionicons name="lock-closed" size={64} color="#999" />
        <Text style={styles.deniedTitle}>Teacher Access Only</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Error state
  if (error || !analytics) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>
          {error || "Failed to load analytics"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Main content
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentClass?.name || "Class"} Analytics
        </Text>
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === "week" && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod("week")}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === "week" && styles.periodButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === "month" && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod("month")}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === "month" && styles.periodButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#fff" : "#000"}
          />
        }
      >
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.metricValue}>
              {analytics.activeStudents}/{analytics.totalStudents}
            </Text>
            <Text style={styles.metricLabel}>Active Students</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="book" size={24} color="#34C759" />
            <Text style={styles.metricValue}>{analytics.avgWordsLearned}</Text>
            <Text style={styles.metricLabel}>Avg Words</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle" size={24} color="#FF9500" />
            <Text style={styles.metricValue}>{analytics.avgAccuracy}%</Text>
            <Text style={styles.metricLabel}>Avg Accuracy</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="time" size={24} color="#5856D6" />
            <Text style={styles.metricValue}>{analytics.avgTimeSpent}m</Text>
            <Text style={styles.metricLabel}>Avg Time</Text>
          </View>
        </View>

        {/* Top Performers */}
        {analytics.topPerformers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Top Performers</Text>
            </View>
            <View style={styles.card}>
              {analytics.topPerformers.map((student, index) => (
                <View
                  key={student.uid}
                  style={[
                    styles.studentRow,
                    index < analytics.topPerformers.length - 1 &&
                      styles.studentRowBorder,
                  ]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {student.displayName}
                    </Text>
                    <Text style={styles.studentStat}>
                      {student.wordsLearned} words learned
                    </Text>
                  </View>
                  <View style={styles.studentStreak}>
                    <Ionicons name="flame" size={16} color="#FF9500" />
                    <Text style={styles.streakText}>
                      {student.currentStreak}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Students Needing Attention */}
        {analytics.needsAttention.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={styles.sectionTitle}>Needs Attention</Text>
            </View>
            <View style={styles.card}>
              {analytics.needsAttention.map((alert, index) => (
                <View
                  key={alert.uid}
                  style={[
                    styles.alertRow,
                    index < analytics.needsAttention.length - 1 &&
                      styles.alertRowBorder,
                  ]}
                >
                  <View style={styles.alertLeft}>
                    <Text style={styles.alertName}>{alert.displayName}</Text>
                    <Text style={styles.alertMessage}>
                      {alert.alertMessage}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      {
                        backgroundColor:
                          getSeverityColor(alert.severity) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        { color: getSeverityColor(alert.severity) },
                      ]}
                    >
                      {alert.severity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {analytics.totalStudents === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#c7c7cc" />
            <Text style={styles.emptyStateTitle}>No Student Data Yet</Text>
            <Text style={styles.emptyStateText}>
              Analytics will appear once students enroll and start learning
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high":
      return "#FF3B30";
    case "medium":
      return "#FF9500";
    default:
      return "#8e8e93";
  }
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
    centerContainer: {
      justifyContent: "center",
      alignItems: "center",
    },

    // Access Denied
    deniedTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 24,
    },
    backButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
    },
    backButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#fff",
    },

    // Header
    header: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383a" : "#e5e5ea",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginBottom: 12,
    },
    periodToggle: {
      flexDirection: "row",
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
      borderRadius: 10,
      padding: 2,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 8,
    },
    periodButtonActive: {
      backgroundColor: isDark ? "#007AFF" : "#007AFF",
    },
    periodButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#8e8e93",
    },
    periodButtonTextActive: {
      color: "#fff",
    },

    // Metrics Grid
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 16,
      gap: 12,
    },
    metricCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
    },
    metricValue: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 8,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 13,
      color: "#8e8e93",
      textAlign: "center",
    },

    // Section
    section: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    card: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
    },

    // Student Row
    studentRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    studentRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383a" : "#e5e5ea",
    },
    rankBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? "#FFD70020" : "#FFD70010",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    rankText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFD700",
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 2,
    },
    studentStat: {
      fontSize: 13,
      color: "#8e8e93",
    },
    studentStreak: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    streakText: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },

    // Alert Row
    alertRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    alertRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383a" : "#e5e5ea",
    },
    alertLeft: {
      flex: 1,
      marginRight: 12,
    },
    alertName: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 2,
    },
    alertMessage: {
      fontSize: 13,
      color: "#8e8e93",
    },
    severityBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    severityText: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "capitalize",
    },

    // Empty State
    emptyState: {
      flex: 1,
      paddingVertical: 64,
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 15,
      color: "#8e8e93",
      textAlign: "center",
    },

    // Error State
    errorText: {
      fontSize: 16,
      color: "#FF3B30",
      textAlign: "center",
      marginTop: 16,
      marginBottom: 24,
      paddingHorizontal: 32,
    },
    retryButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
    },
    retryButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#fff",
    },
  });
