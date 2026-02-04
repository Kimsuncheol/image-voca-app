/**
 * My Class Card Component
 *
 * Displays a student's enrolled class with quick stats
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Class } from "../../../src/types/teacher";

interface MyClassCardProps {
  classData: Class;
  isDark: boolean;
  onPress: () => void;
}

export const MyClassCard: React.FC<MyClassCardProps> = ({
  classData,
  isDark,
  onPress,
}) => {
  const styles = getStyles(isDark);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="school" size={24} color="#007AFF" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.className} numberOfLines={1}>
            {classData.name}
          </Text>
          {classData.description && (
            <Text style={styles.classDescription} numberOfLines={1}>
              {classData.description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
      </View>

      <View style={styles.coursesRow}>
        {classData.courseIds.slice(0, 3).map((courseId) => (
          <View key={courseId} style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>{courseId}</Text>
          </View>
        ))}
        {classData.courseIds.length > 3 && (
          <View style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>
              +{classData.courseIds.length - 3}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    headerInfo: {
      flex: 1,
    },
    className: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 2,
    },
    classDescription: {
      fontSize: 14,
      color: "#8e8e93",
    },
    coursesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
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
  });
