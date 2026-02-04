/**
 * Class Card Component
 *
 * Card displaying class information in the teacher's class list
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Class } from "../../../src/types/teacher";

interface ClassCardProps {
  classData: Class;
}

export const ClassCard: React.FC<ClassCardProps> = ({ classData }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    router.push(`/teacher/class/${classData.id}`);
  };

  const studentCount = classData.studentIds.length;
  const courseCount = classData.courseIds.length;

  return (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="school"
            size={24}
            color={isDark ? "#007AFF" : "#007AFF"}
            style={styles.icon}
          />
          <View style={styles.headerText}>
            <Text style={[styles.className, isDark && styles.classNameDark]}>
              {classData.name}
            </Text>
            {classData.description && (
              <Text
                style={[styles.description, isDark && styles.descriptionDark]}
                numberOfLines={1}
              >
                {classData.description}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#8e8e93" : "#c7c7cc"}
        />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons
            name="people-outline"
            size={16}
            color={isDark ? "#8e8e93" : "#8e8e93"}
          />
          <Text style={[styles.statText, isDark && styles.statTextDark]}>
            {studentCount} {studentCount === 1 ? "student" : "students"}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons
            name="book-outline"
            size={16}
            color={isDark ? "#8e8e93" : "#8e8e93"}
          />
          <Text style={[styles.statText, isDark && styles.statTextDark]}>
            {courseCount} {courseCount === 1 ? "course" : "courses"}
          </Text>
        </View>
      </View>

      {/* Invite Code */}
      <View style={styles.footer}>
        <View style={styles.inviteCodeContainer}>
          <Text style={[styles.inviteLabel, isDark && styles.inviteLabelDark]}>
            Invite Code:
          </Text>
          <View style={[styles.codeBox, isDark && styles.codeBoxDark]}>
            <Text style={[styles.codeText, isDark && styles.codeTextDark]}>
              {classData.inviteCode}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: "#1c1c1e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  classNameDark: {
    color: "#fff",
  },
  description: {
    fontSize: 14,
    color: "#8e8e93",
  },
  descriptionDark: {
    color: "#8e8e93",
  },
  stats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5ea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#8e8e93",
  },
  statTextDark: {
    color: "#8e8e93",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inviteLabel: {
    fontSize: 13,
    color: "#8e8e93",
  },
  inviteLabelDark: {
    color: "#8e8e93",
  },
  codeBox: {
    backgroundColor: "#f2f2f7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  codeBoxDark: {
    backgroundColor: "#2c2c2e",
  },
  codeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    letterSpacing: 1,
  },
  codeTextDark: {
    color: "#0A84FF",
  },
});
