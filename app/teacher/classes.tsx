/**
 * Teacher Classes Screen
 *
 * Main teacher screen displaying all classes
 * Entry point for teacher features
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { ClassCard } from "../../components/teacher/classes/ClassCard";
import { ClassCreateModal } from "../../components/teacher/classes/ClassCreateModal";
import { useAuth } from "../../src/context/AuthContext";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";
import { useTeacherStore } from "../../src/stores/teacherStore";

export default function TeacherClassesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const {
    classes,
    loadingClasses,
    classesError,
    fetchClasses,
    fetchTeacherOverview,
    teacherOverview,
  } = useTeacherStore();

  const [checkingRole, setCheckingRole] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = getStyles(isDark);

  // Check teacher role
  useEffect(() => {
    const checkRole = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCheckingRole(false);
    };
    checkRole();
  }, []);

  // Fetch classes and overview
  useEffect(() => {
    if (user && isTeacher() && !checkingRole) {
      loadData();
    }
  }, [user, checkingRole]);

  const loadData = async () => {
    if (!user) return;
    try {
      await Promise.all([
        fetchClasses(user.uid),
        fetchTeacherOverview(user.uid),
      ]);
    } catch (error) {
      console.error("Error loading teacher data:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateSuccess = () => {
    loadData();
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
        <Text style={styles.deniedMessage}>
          This section is only available to teachers
        </Text>
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
      {/* Overview Stats */}
      {teacherOverview && (
        <View style={styles.overviewContainer}>
          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{teacherOverview.totalClasses}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#34C759" />
            <Text style={styles.statValue}>
              {teacherOverview.totalStudents}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="clipboard-outline" size={24} color="#FF9500" />
            <Text style={styles.statValue}>
              {teacherOverview.pendingAssignments}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      )}

      {/* Classes List */}
      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {loadingClasses && classes.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : classesError ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
            <Text style={styles.errorText}>{classesError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#c7c7cc" />
            <Text style={styles.emptyTitle}>No Classes Yet</Text>
            <Text style={styles.emptyMessage}>
              Create your first class to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyButtonText}>Create Class</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ClassCard classData={item} />}
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
        )}
      </View>

      {/* Create Modal */}
      <ClassCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
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
      color: "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    deniedMessage: {
      fontSize: 16,
      color: "#8e8e93",
      textAlign: "center",
      marginBottom: 24,
      paddingHorizontal: 32,
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

    // Overview
    overviewContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 8,
    },
    statLabel: {
      fontSize: 13,
      color: "#8e8e93",
      marginTop: 4,
    },

    // Content
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    createButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#007AFF",
    },

    // List
    listContent: {
      paddingBottom: 16,
    },

    // Empty State
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 16,
      color: "#8e8e93",
      textAlign: "center",
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
    },
    emptyButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#fff",
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
