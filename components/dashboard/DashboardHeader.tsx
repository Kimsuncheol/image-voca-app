import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface DashboardHeaderProps {
  userName?: string;
  userPhoto?: string | null;
}

export function DashboardHeader({ userName, userPhoto }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();

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
      <TouchableOpacity onPress={() => router.push("/profile")}>
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
  },
});
