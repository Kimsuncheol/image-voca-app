import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface DashboardHeaderProps {
  userName?: string;
  userPhoto?: string | null;
}

export function DashboardHeader({ userName, userPhoto }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.greeting.morning");
    if (hour < 18) return t("dashboard.greeting.afternoon");
    return t("dashboard.greeting.evening");
  };

  return (
    <View style={styles.header}>
      <View>
        <ThemedText style={styles.greeting}>{getGreeting()}</ThemedText>
        <ThemedText type="title">
          {userName || t("dashboard.fallbackUser")}
        </ThemedText>
      </View>
      <TouchableOpacity
        onPress={() => router.push("/profile")}
        style={styles.avatarContainer}
      >
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={24}
              color={isDark ? "#666" : "#999"}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    header: {
      marginBottom: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    greeting: {
      fontSize: 16,
      opacity: 0.6,
      marginBottom: 4,
    },
    avatarContainer: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
      borderRadius: 26,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#fff",
    },
    avatarPlaceholder: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? "#1c1c1e" : "#f0f0f0",
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#fff",
      justifyContent: "center",
      alignItems: "center",
    },
  });
