/**
 * Class Create Modal Component
 *
 * Modal form for creating a new class
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useAuth } from "../../../src/context/AuthContext";
import { CreateClassData } from "../../../src/types/teacher";
import { CourseType, COURSES } from "../../../src/types/vocabulary";
import { useTeacherStore } from "../../../src/stores/teacherStore";

interface ClassCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (classId: string) => void;
}

export const ClassCreateModal: React.FC<ClassCreateModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();
  const createNewClass = useTeacherStore((state) => state.createNewClass);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<CourseType[]>([]);
  const [allowSelfEnrollment, setAllowSelfEnrollment] = useState(true);
  const [loading, setLoading] = useState(false);

  const styles = getStyles(isDark);

  const toggleCourse = (courseId: CourseType) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a class");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter a class name");
      return;
    }

    if (selectedCourses.length === 0) {
      Alert.alert("Error", "Please select at least one course");
      return;
    }

    setLoading(true);

    try {
      const classData: CreateClassData = {
        name: name.trim(),
        description: description.trim(),
        courseIds: selectedCourses,
        settings: {
          allowSelfEnrollment,
        },
      };

      const classId = await createNewClass(user.uid, classData);

      Alert.alert(
        "Success",
        `Class "${name}" created successfully!`,
        [
          {
            text: "OK",
            onPress: () => {
              onSuccess?.(classId);
              handleClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error creating class:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create class. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedCourses([]);
    setAllowSelfEnrollment(true);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Class</Text>
          <TouchableOpacity onPress={handleCreate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.createButton}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Class Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Class Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., TOEFL Prep 2024"
              placeholderTextColor={isDark ? "#8e8e93" : "#c7c7cc"}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this class..."
              placeholderTextColor={isDark ? "#8e8e93" : "#c7c7cc"}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          {/* Course Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Courses *</Text>
            <Text style={styles.helperText}>
              Select the courses assigned to this class
            </Text>
            <View style={styles.courseGrid}>
              {COURSES.map((course) => {
                const isSelected = selectedCourses.includes(course.id);
                return (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.courseCard,
                      isSelected && styles.courseCardSelected,
                    ]}
                    onPress={() => toggleCourse(course.id)}
                    disabled={loading}
                  >
                    <View
                      style={[
                        styles.courseIcon,
                        { backgroundColor: course.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={course.icon as any}
                        size={24}
                        color={course.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.courseTitle,
                        isSelected && styles.courseTitleSelected,
                      ]}
                    >
                      {course.title}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.label}>Settings</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Allow Self-Enrollment</Text>
                <Text style={styles.settingDescription}>
                  Students can join using invite code
                </Text>
              </View>
              <Switch
                value={allowSelfEnrollment}
                onValueChange={setAllowSelfEnrollment}
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
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
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    cancelButton: {
      fontSize: 17,
      color: "#FF3B30",
    },
    createButton: {
      fontSize: 17,
      fontWeight: "600",
      color: "#007AFF",
    },
    content: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
    },
    helperText: {
      fontSize: 13,
      color: isDark ? "#8e8e93" : "#8e8e93",
      marginBottom: 12,
    },
    input: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#e5e5ea",
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    courseGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    courseCard: {
      width: "47%",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 12,
      borderWidth: 2,
      borderColor: "transparent",
      position: "relative",
    },
    courseCardSelected: {
      borderColor: "#007AFF",
    },
    courseIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    courseTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    courseTitleSelected: {
      color: "#007AFF",
    },
    checkmark: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      padding: 16,
    },
    settingLeft: {
      flex: 1,
      marginRight: 12,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: isDark ? "#8e8e93" : "#8e8e93",
    },
  });
