/**
 * Create Assignment Screen
 *
 * Modal form for creating a new assignment
 */

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAssignment } from "../../../src/services/assignmentService";
import { useSubscriptionStore } from "../../../src/stores/subscriptionStore";
import { useTeacherStore } from "../../../src/stores/teacherStore";
import { CourseType } from "../../../src/types/vocabulary";

export default function CreateAssignmentScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const { currentClass, fetchClassDetails } = useTeacherStore();

  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState<CourseType | "">("");
  const [dayNumber, setDayNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [requireVocabulary, setRequireVocabulary] = useState(true);
  const [requireQuiz, setRequireQuiz] = useState(true);
  const [minQuizScore, setMinQuizScore] = useState("");

  const styles = getStyles(isDark);

  // Check teacher role
  useEffect(() => {
    const checkRole = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCheckingRole(false);
    };
    checkRole();
  }, []);

  // Load class details
  useEffect(() => {
    if (classId && isTeacher() && !checkingRole) {
      loadClass();
    }
  }, [classId, checkingRole]);

  const loadClass = async () => {
    if (!classId) return;
    try {
      await fetchClassDetails(classId);
    } catch (error) {
      console.error("Error loading class:", error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!selectedCourse) {
      Alert.alert("Error", "Please select a course");
      return;
    }

    if (!dayNumber || isNaN(Number(dayNumber))) {
      Alert.alert("Error", "Please enter a valid day number");
      return;
    }

    const day = Number(dayNumber);
    if (day < 1 || day > 30) {
      Alert.alert("Error", "Day number must be between 1 and 30");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (requireQuiz && minQuizScore) {
      const score = Number(minQuizScore);
      if (isNaN(score) || score < 0 || score > 100) {
        Alert.alert("Error", "Minimum quiz score must be between 0 and 100");
        return;
      }
    }

    if (!requireVocabulary && !requireQuiz) {
      Alert.alert("Error", "At least one requirement must be selected");
      return;
    }

    try {
      setLoading(true);

      await createAssignment({
        classId: classId!,
        courseId: selectedCourse,
        dayNumber: day,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.toISOString(),
        requiredActions: {
          completeVocabulary: requireVocabulary,
          completeQuiz: requireQuiz,
          minQuizScore: minQuizScore ? Number(minQuizScore) : undefined,
        },
      });

      Alert.alert("Success", "Assignment created successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating assignment:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create assignment",
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checkingRole) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Access denied
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

  // Main content
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Assignment</Text>
          <TouchableOpacity onPress={handleCreate} disabled={loading}>
            <Text
              style={[
                styles.createButton,
                loading && styles.createButtonDisabled,
              ]}
            >
              {loading ? "Creating..." : "Create"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Class Name */}
          {currentClass && (
            <View style={styles.section}>
              <Text style={styles.classNameLabel}>Class</Text>
              <Text style={styles.className}>{currentClass.name}</Text>
            </View>
          )}

          {/* Course Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course *</Text>
            <View style={styles.courseButtons}>
              {currentClass?.courseIds.map((course) => (
                <TouchableOpacity
                  key={course}
                  style={[
                    styles.courseButton,
                    selectedCourse === course && styles.courseButtonSelected,
                  ]}
                  onPress={() => setSelectedCourse(course as CourseType)}
                >
                  <Text
                    style={[
                      styles.courseButtonText,
                      selectedCourse === course &&
                        styles.courseButtonTextSelected,
                    ]}
                  >
                    {course}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Day Number */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Day Number (1-30) *</Text>
            <TextInput
              style={styles.input}
              value={dayNumber}
              onChangeText={setDayNumber}
              keyboardType="number-pad"
              placeholder="Enter day number"
              placeholderTextColor="#8e8e93"
            />
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="E.g., Week 1 Vocabulary"
              placeholderTextColor="#8e8e93"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description..."
              placeholderTextColor="#8e8e93"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Due Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Due Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={styles.dateButtonText}>
                {dueDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements *</Text>

            <View style={styles.requirementRow}>
              <Text style={styles.requirementLabel}>Complete Vocabulary</Text>
              <Switch
                value={requireVocabulary}
                onValueChange={setRequireVocabulary}
                trackColor={{ false: "#767577", true: "#007AFF80" }}
                thumbColor={requireVocabulary ? "#007AFF" : "#f4f3f4"}
              />
            </View>

            <View style={styles.requirementRow}>
              <Text style={styles.requirementLabel}>Complete Quiz</Text>
              <Switch
                value={requireQuiz}
                onValueChange={setRequireQuiz}
                trackColor={{ false: "#767577", true: "#007AFF80" }}
                thumbColor={requireQuiz ? "#007AFF" : "#f4f3f4"}
              />
            </View>

            {requireQuiz && (
              <View style={styles.quizScoreSection}>
                <Text style={styles.quizScoreLabel}>
                  Minimum Quiz Score (optional)
                </Text>
                <View style={styles.quizScoreInput}>
                  <TextInput
                    style={styles.scoreInput}
                    value={minQuizScore}
                    onChangeText={setMinQuizScore}
                    keyboardType="number-pad"
                    placeholder="0-100"
                    placeholderTextColor="#8e8e93"
                  />
                  <Text style={styles.percentText}>%</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383a" : "#e5e5ea",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    cancelButton: {
      fontSize: 17,
      color: "#007AFF",
    },
    createButton: {
      fontSize: 17,
      fontWeight: "600",
      color: "#007AFF",
    },
    createButtonDisabled: {
      opacity: 0.5,
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

    // Content
    content: {
      flex: 1,
      padding: 16,
    },

    // Class Name
    classNameLabel: {
      fontSize: 13,
      color: "#8e8e93",
      marginBottom: 4,
    },
    className: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },

    // Section
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // Course Selection
    courseButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    courseButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: isDark ? "#2c2c2e" : "#fff",
      borderWidth: 2,
      borderColor: isDark ? "#38383a" : "#e5e5ea",
    },
    courseButtonSelected: {
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      borderColor: "#007AFF",
    },
    courseButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    courseButtonTextSelected: {
      color: "#007AFF",
    },

    // Input
    input: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      padding: 12,
      fontSize: 17,
      color: isDark ? "#fff" : "#000",
      borderWidth: 1,
      borderColor: isDark ? "#38383a" : "#e5e5ea",
    },
    textArea: {
      height: 100,
      paddingTop: 12,
    },

    // Date Button
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      padding: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: isDark ? "#38383a" : "#e5e5ea",
    },
    dateButtonText: {
      fontSize: 17,
      color: isDark ? "#fff" : "#000",
    },

    // Requirements
    requirementRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      padding: 16,
      marginBottom: 8,
    },
    requirementLabel: {
      fontSize: 17,
      color: isDark ? "#fff" : "#000",
    },

    // Quiz Score
    quizScoreSection: {
      marginTop: 8,
      paddingLeft: 16,
    },
    quizScoreLabel: {
      fontSize: 15,
      color: "#8e8e93",
      marginBottom: 8,
    },
    quizScoreInput: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    scoreInput: {
      flex: 1,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      padding: 12,
      fontSize: 17,
      color: isDark ? "#fff" : "#000",
      borderWidth: 1,
      borderColor: isDark ? "#38383a" : "#e5e5ea",
    },
    percentText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#8e8e93",
    },
  });
