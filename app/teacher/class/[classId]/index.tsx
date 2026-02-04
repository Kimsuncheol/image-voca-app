/**
 * Class Detail Screen
 *
 * Displays detailed class information with students list
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Share,
  Clipboard,
} from "react-native";
import { StudentListItem } from "../../../../components/teacher/students/StudentListItem";
import { useSubscriptionStore } from "../../../../src/stores/subscriptionStore";
import { useTeacherStore } from "../../../../src/stores/teacherStore";

export default function ClassDetailScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const {
    currentClass,
    classStudents,
    loadingClasses,
    loadingStudents,
    classesError,
    fetchClassDetails,
  } = useTeacherStore();

  const [refreshing, setRefreshing] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const styles = getStyles(isDark);

  // Check teacher role
  useEffect(() => {
    const checkRole = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCheckingRole(false);
    };
    checkRole();
  }, []);

  // Fetch class details
  useEffect(() => {
    if (classId && isTeacher() && !checkingRole) {
      loadData();
    }
  }, [classId, checkingRole]);

  const loadData = async () => {
    if (!classId) return;
    try {
      await fetchClassDetails(classId);
    } catch (error) {
      console.error("Error loading class details:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCopyInviteCode = () => {
    if (currentClass?.inviteCode) {
      Clipboard.setString(currentClass.inviteCode);
      Alert.alert("Copied!", "Invite code copied to clipboard");
    }
  };

  const handleShareInviteCode = async () => {
    if (!currentClass) return;

    try {
      await Share.share({
        message: `Join my class "${currentClass.name}" with invite code: ${currentClass.inviteCode}`,
      });
    } catch (error) {
      console.error("Error sharing invite code:", error);
    }
  };

  // Loading state while checking role
  if (checkingRole) {
    return (
      <View style={[styles.centerContainer, styles.loadingContainer]}>
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
  if (loadingClasses && !currentClass) {
    return (
      <View style={[styles.centerContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Error state
  if (classesError) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{classesError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Class not found
  if (!currentClass) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <Ionicons name="school-outline" size={64} color="#c7c7cc" />
        <Text style={styles.errorText}>Class not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
        {/* Class Info Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.iconContainer}>
              <Ionicons name="school" size={32} color="#007AFF" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.className}>{currentClass.name}</Text>
              {currentClass.description && (
                <Text style={styles.classDescription}>
                  {currentClass.description}
                </Text>
              )}
            </View>
          </View>

          {/* Invite Code */}
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>Invite Code</Text>
            <View style={styles.inviteCodeRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{currentClass.inviteCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleCopyInviteCode}
              >
                <Ionicons name="copy-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleShareInviteCode}
              >
                <Ionicons name="share-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Courses */}
          <View style={styles.coursesSection}>
            <Text style={styles.sectionLabel}>Assigned Courses</Text>
            <View style={styles.coursesRow}>
              {currentClass.courseIds.map((courseId) => (
                <View key={courseId} style={styles.courseBadge}>
                  <Text style={styles.courseBadgeText}>{courseId}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push(`/teacher/class/${classId}/assignments`)
            }
          >
            <Ionicons name="clipboard-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Assignments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/teacher/class/${classId}/analytics`)}
          >
            <Ionicons name="stats-chart-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Students List */}
        <View style={styles.studentsSection}>
          <View style={styles.studentsHeader}>
            <Text style={styles.sectionTitle}>
              Students ({classStudents.length})
            </Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="person-add-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {loadingStudents ? (
            <View style={styles.loadingStudents}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : classStudents.length === 0 ? (
            <View style={styles.emptyStudents}>
              <Ionicons name="people-outline" size={48} color="#c7c7cc" />
              <Text style={styles.emptyStudentsText}>
                No students enrolled yet
              </Text>
              <Text style={styles.emptyStudentsSubtext}>
                Share the invite code to add students
              </Text>
            </View>
          ) : (
            <View style={styles.studentsList}>
              {classStudents.map((student) => (
                <StudentListItem key={student.uid} student={student} />
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
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContainer: {
      backgroundColor: isDark ? "#000" : "#f2f2f7",
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
      alignItems: "center",
      marginBottom: 16,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    headerInfo: {
      flex: 1,
    },
    className: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    classDescription: {
      fontSize: 15,
      color: "#8e8e93",
    },

    // Invite Section
    inviteSection: {
      marginBottom: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#38383a" : "#e5e5ea",
    },
    inviteLabel: {
      fontSize: 13,
      color: "#8e8e93",
      marginBottom: 8,
    },
    inviteCodeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    codeBox: {
      flex: 1,
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
    },
    codeText: {
      fontSize: 20,
      fontWeight: "700",
      color: "#007AFF",
      letterSpacing: 2,
      textAlign: "center",
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
      alignItems: "center",
      justifyContent: "center",
    },

    // Courses Section
    coursesSection: {
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#38383a" : "#e5e5ea",
    },
    sectionLabel: {
      fontSize: 13,
      color: "#8e8e93",
      marginBottom: 8,
    },
    coursesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    courseBadge: {
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    courseBadgeText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#007AFF",
    },

    // Actions Section
    actionsSection: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: "center",
      gap: 6,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#007AFF",
    },

    // Students Section
    studentsSection: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 16,
      marginBottom: 16,
    },
    studentsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingStudents: {
      paddingVertical: 32,
      alignItems: "center",
    },
    emptyStudents: {
      paddingVertical: 48,
      alignItems: "center",
    },
    emptyStudentsText: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginTop: 12,
      marginBottom: 4,
    },
    emptyStudentsSubtext: {
      fontSize: 14,
      color: "#8e8e93",
      textAlign: "center",
    },
    studentsList: {
      gap: 0,
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
