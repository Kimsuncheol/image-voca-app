/**
 * Assignment Detail Screen
 *
 * Shows assignment details and all student submissions
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  deleteAssignment,
  getAssignmentDetails,
} from "../../../../src/services/assignmentService";
import { useSubscriptionStore } from "../../../../src/stores/subscriptionStore";
import {
  AssignmentWithSubmissions,
  Submission,
} from "../../../../src/types/teacher";

export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);

  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignment, setAssignment] =
    useState<AssignmentWithSubmissions | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styles = getStyles(isDark);

  // Check teacher role
  useEffect(() => {
    const checkRole = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCheckingRole(false);
    };
    checkRole();
  }, []);

  // Load assignment details
  useEffect(() => {
    if (assignmentId && isTeacher() && !checkingRole) {
      loadData();
    }
  }, [assignmentId, checkingRole]);

  const loadData = async () => {
    if (!assignmentId) return;

    try {
      setError(null);
      const details = await getAssignmentDetails(assignmentId);
      setAssignment(details);
    } catch (error) {
      console.error("Error loading assignment details:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load assignment details",
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

  const handleDelete = () => {
    Alert.alert(
      "Delete Assignment",
      "Are you sure you want to delete this assignment? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAssignment(assignmentId!);
              Alert.alert("Success", "Assignment deleted successfully", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error("Error deleting assignment:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete assignment",
              );
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#34C759";
      case "in_progress":
        return "#FF9500";
      default:
        return "#8e8e93";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Not Started";
    }
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
  if (error || !assignment) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error || "Assignment not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render submission item
  const renderSubmission = ({ item }: { item: Submission }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <View style={styles.submissionCard}>
        <View style={styles.submissionHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.studentId}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}20` },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.submissionDetails}>
          <View style={styles.detailRow}>
            <Ionicons
              name={
                item.vocabularyCompleted
                  ? "checkmark-circle"
                  : "ellipse-outline"
              }
              size={16}
              color={item.vocabularyCompleted ? "#34C759" : "#8e8e93"}
            />
            <Text style={styles.detailText}>Vocabulary</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name={item.quizCompleted ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={item.quizCompleted ? "#34C759" : "#8e8e93"}
            />
            <Text style={styles.detailText}>
              Quiz {item.quizScore !== undefined ? `(${item.quizScore}%)` : ""}
            </Text>
          </View>
        </View>

        {item.completedAt && (
          <Text style={styles.completedAtText}>
            Completed: {formatDate(item.completedAt)}
          </Text>
        )}
      </View>
    );
  };

  // Main content
  return (
    <SafeAreaView style={styles.container}>
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
        {/* Assignment Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.courseBadge}>
                <Text style={styles.courseBadgeText}>
                  {assignment.courseId}
                </Text>
              </View>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>
                  Day {assignment.dayNumber}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>

          <Text style={styles.assignmentTitle}>{assignment.title}</Text>

          {assignment.description && (
            <Text style={styles.assignmentDescription}>
              {assignment.description}
            </Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#8e8e93" />
              <Text style={styles.metaText}>
                Due: {formatDate(assignment.dueDate)}
              </Text>
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={styles.sectionLabel}>Requirements</Text>
            <View style={styles.requirementsRow}>
              {assignment.requiredActions.completeVocabulary && (
                <View style={styles.requirementBadge}>
                  <Ionicons name="book-outline" size={14} color="#007AFF" />
                  <Text style={styles.requirementText}>Vocabulary</Text>
                </View>
              )}
              {assignment.requiredActions.completeQuiz && (
                <View style={styles.requirementBadge}>
                  <Ionicons name="checkbox-outline" size={14} color="#007AFF" />
                  <Text style={styles.requirementText}>
                    Quiz
                    {assignment.requiredActions.minQuizScore
                      ? ` (${assignment.requiredActions.minQuizScore}%+)`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{assignment.totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#34C759" }]}>
              {assignment.completedCount}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#007AFF" }]}>
              {Math.round(assignment.completionPercentage)}%
            </Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
        </View>

        {/* Submissions */}
        <View style={styles.submissionsSection}>
          <View style={styles.submissionsHeader}>
            <Text style={styles.sectionTitle}>
              Student Submissions ({assignment.submissions.length})
            </Text>
          </View>

          {assignment.submissions.length === 0 ? (
            <View style={styles.emptySubmissions}>
              <Ionicons name="people-outline" size={48} color="#c7c7cc" />
              <Text style={styles.emptySubmissionsText}>
                No submissions yet
              </Text>
            </View>
          ) : (
            <View style={styles.submissionsList}>
              {assignment.submissions.map((submission) => (
                <React.Fragment key={submission.studentId}>
                  {renderSubmission({ item: submission })}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
      padding: 16,
      marginBottom: 16,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: "row",
      gap: 8,
    },
    courseBadge: {
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    courseBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#007AFF",
    },
    dayBadge: {
      backgroundColor: isDark ? "#8e8e9320" : "#8e8e9310",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    dayBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#8e8e93",
    },
    deleteButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? "#FF3B3020" : "#FF3B3010",
      alignItems: "center",
      justifyContent: "center",
    },
    assignmentTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
    },
    assignmentDescription: {
      fontSize: 15,
      color: "#8e8e93",
      marginBottom: 16,
      lineHeight: 22,
    },
    metaRow: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      fontSize: 14,
      color: "#8e8e93",
    },

    // Requirements
    requirementsSection: {
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#38383a" : "#e5e5ea",
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    requirementsRow: {
      flexDirection: "row",
      gap: 8,
    },
    requirementBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: isDark ? "#007AFF10" : "#007AFF08",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    requirementText: {
      fontSize: 13,
      color: "#007AFF",
      fontWeight: "500",
    },

    // Stats
    statsSection: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
    },
    statValue: {
      fontSize: 28,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: "#8e8e93",
      textAlign: "center",
    },

    // Submissions
    submissionsSection: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 16,
      marginBottom: 16,
    },
    submissionsHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    submissionsList: {
      gap: 12,
    },
    submissionCard: {
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
      borderRadius: 10,
      padding: 12,
    },
    submissionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    studentInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    studentName: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    submissionDetails: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    detailText: {
      fontSize: 13,
      color: "#8e8e93",
    },
    completedAtText: {
      fontSize: 12,
      color: "#8e8e93",
      marginTop: 4,
    },
    emptySubmissions: {
      paddingVertical: 48,
      alignItems: "center",
    },
    emptySubmissionsText: {
      fontSize: 15,
      color: "#8e8e93",
      marginTop: 12,
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
