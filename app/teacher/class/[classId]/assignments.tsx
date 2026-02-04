/**
 * Class Assignments Screen
 *
 * Lists all assignments for a class
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getClassAssignments } from "../../../../src/services/assignmentService";
import { useSubscriptionStore } from "../../../../src/stores/subscriptionStore";
import { useTeacherStore } from "../../../../src/stores/teacherStore";
import { Assignment } from "../../../../src/types/teacher";

export default function ClassAssignmentsScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const { currentClass, fetchClassDetails } = useTeacherStore();

  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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

  // Load class and assignments
  useEffect(() => {
    if (classId && isTeacher() && !checkingRole) {
      loadData();
    }
  }, [classId, checkingRole]);

  const loadData = async () => {
    if (!classId) return;

    try {
      setError(null);
      // Load class details if not already loaded
      if (!currentClass || currentClass.id !== classId) {
        await fetchClassDetails(classId);
      }
      // Load assignments
      const classAssignments = await getClassAssignments(classId);
      setAssignments(classAssignments);
    } catch (error) {
      console.error("Error loading assignments:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load assignments",
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

  const handleCreateAssignment = () => {
    router.push(`/teacher/assignments/create?classId=${classId}`);
  };

  const handleAssignmentPress = (assignmentId: string) => {
    router.push(`/teacher/assignments/${assignmentId}/detail`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
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
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render assignment item
  const renderAssignment = ({ item }: { item: Assignment }) => {
    const overdue = isOverdue(item.dueDate);
    const dateText = formatDate(item.dueDate);

    return (
      <TouchableOpacity
        style={styles.assignmentCard}
        onPress={() => handleAssignmentPress(item.id)}
      >
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentLeft}>
            <View style={[styles.courseBadge]}>
              <Text style={styles.courseBadgeText}>{item.courseId}</Text>
            </View>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day {item.dayNumber}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
        </View>

        <Text style={styles.assignmentTitle}>{item.title}</Text>

        {item.description && (
          <Text style={styles.assignmentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.assignmentFooter}>
          <View style={styles.requirementsRow}>
            {item.requiredActions.completeVocabulary && (
              <View style={styles.requirementBadge}>
                <Ionicons name="book-outline" size={12} color="#007AFF" />
                <Text style={styles.requirementText}>Vocab</Text>
              </View>
            )}
            {item.requiredActions.completeQuiz && (
              <View style={styles.requirementBadge}>
                <Ionicons name="checkbox-outline" size={12} color="#007AFF" />
                <Text style={styles.requirementText}>
                  Quiz
                  {item.requiredActions.minQuizScore
                    ? ` (${item.requiredActions.minQuizScore}%)`
                    : ""}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.dueDateText, overdue && styles.overdueText]}>
            {dateText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Main content
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentClass?.name || "Class"} Assignments
        </Text>
        <Text style={styles.headerSubtitle}>
          {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {assignments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color="#c7c7cc" />
          <Text style={styles.emptyStateTitle}>No Assignments Yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first assignment to get started
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAssignment}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Assignment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={assignments}
            renderItem={renderAssignment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDark ? "#fff" : "#000"}
              />
            }
          />

          <TouchableOpacity style={styles.fab} onPress={handleCreateAssignment}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}
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
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 15,
      color: "#8e8e93",
    },

    // List
    listContent: {
      padding: 16,
      paddingBottom: 80,
    },

    // Assignment Card
    assignmentCard: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    assignmentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    assignmentLeft: {
      flexDirection: "row",
      gap: 8,
    },
    courseBadge: {
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    courseBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#007AFF",
    },
    dayBadge: {
      backgroundColor: isDark ? "#8e8e9320" : "#8e8e9310",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    dayBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#8e8e93",
    },
    assignmentTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    assignmentDescription: {
      fontSize: 14,
      color: "#8e8e93",
      marginBottom: 12,
    },
    assignmentFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    requirementsRow: {
      flexDirection: "row",
      gap: 8,
      flex: 1,
    },
    requirementBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "#007AFF10" : "#007AFF08",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    requirementText: {
      fontSize: 12,
      color: "#007AFF",
      fontWeight: "500",
    },
    dueDateText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#8e8e93",
    },
    overdueText: {
      color: "#FF3B30",
    },

    // Empty State
    emptyState: {
      flex: 1,
      justifyContent: "center",
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
      marginBottom: 24,
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
      gap: 8,
    },
    createButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#fff",
    },

    // FAB
    fab: {
      position: "absolute",
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
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
