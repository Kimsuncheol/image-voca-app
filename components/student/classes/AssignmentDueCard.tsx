/**
 * Assignment Due Card Component
 *
 * Displays an urgent assignment alert for students
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AssignmentWithSubmission } from "../../../src/types/teacher";

interface AssignmentDueCardProps {
  assignment: AssignmentWithSubmission;
  isDark: boolean;
  onPress: () => void;
}

export const AssignmentDueCard: React.FC<AssignmentDueCardProps> = ({
  assignment,
  isDark,
  onPress,
}) => {
  const styles = getStyles(isDark);

  const getDaysUntilDue = () => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueText = () => {
    const days = getDaysUntilDue();
    if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
  };

  const getStatusColor = () => {
    if (assignment.submission?.status === "completed") return "#34C759";
    if (assignment.isOverdue) return "#FF3B30";
    const days = getDaysUntilDue();
    if (days <= 1) return "#FF9500";
    return "#007AFF";
  };

  const statusColor = getStatusColor();
  const dueText = getDueText();
  const isCompleted = assignment.submission?.status === "completed";

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: statusColor }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons
              name={isCompleted ? "checkmark-circle" : "clipboard"}
              size={20}
              color={statusColor}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.className} numberOfLines={1}>
              {assignment.className}
            </Text>
            <View style={styles.badgesRow}>
              <View style={styles.courseBadge}>
                <Text style={styles.courseBadgeText}>{assignment.courseId}</Text>
              </View>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>Day {assignment.dayNumber}</Text>
              </View>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
      </View>

      <Text style={styles.assignmentTitle} numberOfLines={1}>
        {assignment.title}
      </Text>

      <View style={styles.footer}>
        <View style={styles.requirementsRow}>
          {assignment.requiredActions.completeVocabulary && (
            <View style={styles.requirementBadge}>
              <Ionicons
                name={
                  assignment.submission?.vocabularyCompleted
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={12}
                color={
                  assignment.submission?.vocabularyCompleted ? "#34C759" : "#8e8e93"
                }
              />
              <Text style={styles.requirementText}>Vocab</Text>
            </View>
          )}
          {assignment.requiredActions.completeQuiz && (
            <View style={styles.requirementBadge}>
              <Ionicons
                name={
                  assignment.submission?.quizCompleted
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={12}
                color={assignment.submission?.quizCompleted ? "#34C759" : "#8e8e93"}
              />
              <Text style={styles.requirementText}>Quiz</Text>
            </View>
          )}
        </View>

        <View style={[styles.dueBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.dueText, { color: statusColor }]}>
            {isCompleted ? "Completed" : dueText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    headerLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerInfo: {
      flex: 1,
    },
    className: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    badgesRow: {
      flexDirection: "row",
      gap: 6,
    },
    courseBadge: {
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    courseBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#007AFF",
    },
    dayBadge: {
      backgroundColor: isDark ? "#8e8e9320" : "#8e8e9310",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    dayBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#8e8e93",
    },
    assignmentTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 10,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    requirementsRow: {
      flexDirection: "row",
      gap: 8,
    },
    requirementBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    requirementText: {
      fontSize: 12,
      color: "#8e8e93",
    },
    dueBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    dueText: {
      fontSize: 12,
      fontWeight: "600",
    },
  });
