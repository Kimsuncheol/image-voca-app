import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
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
  isDark: boolean;
  courses: Course[];
}

export default function AddVocaHeader({
  selectedCourse,
  setSelectedCourse,
  isDark,
  courses,
}: AddVocaHeaderProps) {
  const styles = getStyles(isDark);

  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Select Course</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseContainer}
        >
          {courses.map((course) => (
            <TouchableOpacity
              key={course.name}
              style={[
                styles.courseButton,
                selectedCourse.name === course.name &&
                  styles.courseButtonActive,
              ]}
              onPress={() => {
                console.log("Selected course:", course.name);
                setSelectedCourse(course);
              }}
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
        </ScrollView>
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
      gap: 10,
      paddingRight: 20, // Add padding at the end for better scrolling experience
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
  });
