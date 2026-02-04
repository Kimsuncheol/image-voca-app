/**
 * Student List Item Component
 *
 * Component displaying student information in a list
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { StudentListItem as StudentData } from "../../../src/types/teacher";

interface StudentListItemProps {
  student: StudentData;
  onPress?: () => void;
  showProgress?: boolean;
}

export const StudentListItem: React.FC<StudentListItemProps> = ({
  student,
  onPress,
  showProgress = false,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/teacher/students/${student.uid}/profile`);
    }
  };

  const formatLastActive = (dateString: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, isDark && styles.containerDark]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {/* Profile Photo */}
        {student.photoURL ? (
          <Image
            source={{ uri: student.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons
              name="person"
              size={24}
              color={isDark ? "#8e8e93" : "#c7c7cc"}
            />
          </View>
        )}

        {/* Student Info */}
        <View style={styles.info}>
          <Text style={[styles.name, isDark && styles.nameDark]}>
            {student.displayName}
          </Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons
                name="flame-outline"
                size={14}
                color={student.currentStreak > 0 ? "#FF9500" : "#8e8e93"}
              />
              <Text style={[styles.statText, isDark && styles.statTextDark]}>
                {student.currentStreak} day streak
              </Text>
            </View>
            <Text style={[styles.separator, isDark && styles.separatorDark]}>
              •
            </Text>
            <View style={styles.statItem}>
              <Ionicons
                name="book-outline"
                size={14}
                color={isDark ? "#8e8e93" : "#8e8e93"}
              />
              <Text style={[styles.statText, isDark && styles.statTextDark]}>
                {student.wordsLearned} words
              </Text>
            </View>
          </View>
          <Text style={[styles.lastActive, isDark && styles.lastActiveDark]}>
            Last active: {formatLastActive(student.lastActiveDate)}
          </Text>
        </View>
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {showProgress && student.classProgress !== undefined && (
          <View style={styles.progressContainer}>
            <Text
              style={[styles.progressText, isDark && styles.progressTextDark]}
            >
              {student.classProgress}%
            </Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#8e8e93" : "#c7c7cc"}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerDark: {
    backgroundColor: "#1c1c1e",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#f2f2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  nameDark: {
    color: "#fff",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: "#8e8e93",
  },
  statTextDark: {
    color: "#8e8e93",
  },
  separator: {
    fontSize: 13,
    color: "#8e8e93",
  },
  separatorDark: {
    color: "#8e8e93",
  },
  lastActive: {
    fontSize: 12,
    color: "#c7c7cc",
  },
  lastActiveDark: {
    color: "#8e8e93",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressContainer: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  progressTextDark: {
    color: "#fff",
  },
});
