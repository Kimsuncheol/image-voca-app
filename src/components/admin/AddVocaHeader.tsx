import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Course {
  name: string;
  path: string;
}

interface AddVocaHeaderProps {
  selectedCourse: Course;
  setSelectedCourse: (course: Course) => void;
  subcollectionName: string;
  setSubcollectionName: (name: string) => void;
  isDark: boolean;
  courses: Course[];
}

export default function AddVocaHeader({
  selectedCourse,
  setSelectedCourse,
  subcollectionName,
  setSubcollectionName,
  isDark,
  courses,
}: AddVocaHeaderProps) {
  const styles = getStyles(isDark);

  return (
    <>
      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={isDark ? "#eee" : "#333"}
        />
        <Text style={styles.infoText}>
          Select a Course and define the day/unit (e.g., Day1).{"\n"}
          Then upload your CSV or import from Google Sheets.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Select Course</Text>
        <View style={styles.courseContainer}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.name}
              style={[
                styles.courseButton,
                selectedCourse.name === course.name &&
                  styles.courseButtonActive,
              ]}
              onPress={() => setSelectedCourse(course)}
            >
              <Text
                style={[
                  styles.courseButtonText,
                  selectedCourse.name === course.name &&
                    styles.courseButtonTextActive,
                ]}
              >
                {course.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Subcollection Name</Text>
        <View style={styles.dayInputContainer}>
          <View style={styles.dayPrefix}>
            <Text style={styles.dayPrefixText}>Day</Text>
          </View>
          <TextInput
            style={styles.dayInput}
            value={subcollectionName}
            onChangeText={setSubcollectionName}
            placeholder="1"
            placeholderTextColor={isDark ? "#555" : "#999"}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.pathHint}>
          Target: .../{selectedCourse.name}/.../Day{subcollectionName}
        </Text>
      </View>
    </>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    infoBox: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      alignItems: "center",
    },
    infoText: {
      color: isDark ? "#e5e5e7" : "#333",
      marginLeft: 12,
      flex: 1,
      lineHeight: 20,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: isDark ? "#8e8e93" : "#6e6e73",
      textTransform: "uppercase",
      marginLeft: 4,
    },
    courseContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    courseButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: isDark ? "#2c2c2e" : "#e5e5ea",
      marginBottom: 8,
    },
    courseButtonActive: {
      backgroundColor: "#007AFF",
    },
    courseButtonText: {
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
    },
    courseButtonTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    dayInputContainer: {
      flexDirection: "row",
      alignItems: "stretch",
      marginBottom: 8,
    },
    dayPrefix: {
      backgroundColor: "#0b51e6",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    dayPrefixText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    dayInput: {
      flex: 1,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
      borderLeftWidth: 0,
    },
    pathHint: {
      fontSize: 12,
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginTop: 6,
      fontStyle: "italic",
    },
  });
