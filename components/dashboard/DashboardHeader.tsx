import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
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
  const [menuVisible, setMenuVisible] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.greeting.morning");
    if (hour < 18) return t("dashboard.greeting.afternoon");
    return t("dashboard.greeting.evening");
  };

  const handleMenuItemPress = (route: string) => {
    setMenuVisible(false);
    router.push(route as any);
  };

  const menuItems = [
    {
      icon: "person" as const,
      label: t("dashboard.menu.profile"),
      route: "/profile",
      color: "#007AFF",
    },
    {
      icon: "people" as const,
      label: t("dashboard.menu.friends"),
      route: "/friends",
      color: "#FF9500",
    },
    {
      icon: "trophy" as const,
      label: t("dashboard.menu.leaderboard"),
      route: "/leaderboard",
      color: "#FFD700",
    },
  ];

  return (
    <View style={styles.header}>
      <View>
        <ThemedText style={styles.greeting}>{getGreeting()}</ThemedText>
        <ThemedText type="title">
          {userName || t("dashboard.fallbackUser")}
        </ThemedText>
      </View>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
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

      {/* Avatar Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => handleMenuItemPress(item.route)}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: item.color + "15" }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <ThemedText style={styles.menuItemText}>{item.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    menuOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
      paddingTop: 100,
      paddingRight: 20,
    },
    menuContainer: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      minWidth: 220,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#333" : "#f0f0f0",
    },
    menuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: "500",
    },
  });
