/**
 * Class Students Screen
 *
 * Shows a grid view of all students in the class with their progress
 * Displays key metrics: words learned, streak, quiz scores, activity
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { useSubscriptionStore } from "../../../../src/stores/subscriptionStore";
import { getClassStudents } from "../../../../src/services/classService";
import type { StudentListItem } from "../../../../src/types/teacher";

export default function ClassStudentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { classId } = useLocalSearchParams<{ classId: string }>();

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "progress" | "streak">("name");

  useEffect(() => {
    checkTeacherRole();
  }, []);

  useEffect(() => {
    if (!checkingRole && isTeacher()) {
      loadStudents();
    }
  }, [checkingRole, classId]);

  const checkTeacherRole = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    setCheckingRole(false);
  };

  const loadStudents = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const data = await getClassStudents(classId);
      setStudents(data);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const getSortedStudents = () => {
    return [...students].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.displayName || "").localeCompare(b.displayName || "");
        case "progress":
          return (b.classProgress || 0) - (a.classProgress || 0);
        case "streak":
          return (b.currentStreak || 0) - (a.currentStreak || 0);
        default:
          return 0;
      }
    });
  };

  const handleStudentPress = (studentId: string) => {
    router.push(`/teacher/students/${studentId}/profile`);
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
      {/* Sort Controls */}
      <View style={[styles.sortBar, isDark && styles.sortBarDark]}>
        <Text style={[styles.sortLabel, isDark && styles.sortLabelDark]}>
          {t("teacher.students.sortBy")}:
        </Text>
        <TouchableOpacity
          onPress={() => setSortBy("name")}
          style={[
            styles.sortButton,
            sortBy === "name" && styles.sortButtonActive,
          ]}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "name" && styles.sortButtonTextActive,
            ]}
          >
            {t("teacher.students.sortByName")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy("progress")}
          style={[
            styles.sortButton,
            sortBy === "progress" && styles.sortButtonActive,
          ]}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "progress" && styles.sortButtonTextActive,
            ]}
          >
            {t("teacher.students.sortByProgress")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy("streak")}
          style={[
            styles.sortButton,
            sortBy === "streak" && styles.sortButtonActive,
          ]}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "streak" && styles.sortButtonTextActive,
            ]}
          >
            {t("teacher.students.sortByStreak")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Student Grid */}
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
        ) : students.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#999" />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {t("teacher.students.noStudents")}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {getSortedStudents().map((student) => (
              <TouchableOpacity
                key={student.uid}
                style={[styles.studentCard, isDark && styles.studentCardDark]}
                onPress={() => handleStudentPress(student.uid)}
              >
                {/* Student Avatar/Initial */}
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: getAvatarColor(student.displayName) },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(student.displayName)}
                  </Text>
                </View>

                {/* Student Name */}
                <Text
                  style={[styles.studentName, isDark && styles.studentNameDark]}
                  numberOfLines={1}
                >
                  {student.displayName || "Unknown"}
                </Text>

                {/* Metrics */}
                <View style={styles.metrics}>
                  <View style={styles.metricRow}>
                    <Ionicons name="book-outline" size={14} color="#666" />
                    <Text
                      style={[
                        styles.metricText,
                        isDark && styles.metricTextDark,
                      ]}
                    >
                      {student.wordsLearned || 0}
                    </Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Ionicons name="flame-outline" size={14} color="#FF6B35" />
                    <Text
                      style={[
                        styles.metricText,
                        isDark && styles.metricTextDark,
                      ]}
                    >
                      {student.currentStreak || 0}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View
                  style={[
                    styles.progressBar,
                    isDark && styles.progressBarDark,
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${student.classProgress || 0}%` },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.progressText,
                    isDark && styles.progressTextDark,
                  ]}
                >
                  {Math.round(student.classProgress || 0)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (
    (parts[0][0]?.toUpperCase() || "") + (parts[1][0]?.toUpperCase() || "")
  );
}

function getAvatarColor(name: string): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ];
  const index =
    (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
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
  sortBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sortBarDark: {
    backgroundColor: "#1C1C1E",
    borderBottomColor: "#333",
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 12,
  },
  sortLabelDark: {
    color: "#FFF",
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: "#007AFF",
  },
  sortButtonText: {
    fontSize: 12,
    color: "#666",
  },
  sortButtonTextActive: {
    color: "#FFF",
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  studentCard: {
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
  studentCardDark: {
    backgroundColor: "#1C1C1E",
    shadowColor: "#FFF",
    shadowOpacity: 0.05,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  studentNameDark: {
    color: "#FFF",
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  metricTextDark: {
    color: "#999",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarDark: {
    backgroundColor: "#333",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
  },
  progressTextDark: {
    color: "#999",
  },
});
