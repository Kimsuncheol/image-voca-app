import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/ThemeContext";
import { auth } from "../../src/services/firebase";

// Dynamically require to avoid crash on Expo Go Android
let Notifications: any;
if (Platform.OS !== "android") {
  try {
    Notifications = require("expo-notifications");
  } catch (e) {
    console.warn("Failed to load expo-notifications", e);
  }
}

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "android") {
      // Skip on Android Expo Go
      return;
    }
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!Notifications) return;
    try {
      const settings = await Notifications.getPermissionsAsync();
      setPushEnabled(
        settings.granted ||
          settings.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL
      );
    } catch (e) {
      console.warn("Error checking notification status", e);
    }
  };

  const togglePushNotifications = async (value: boolean) => {
    if (Platform.OS === "android") {
      Alert.alert(
        "Not Supported",
        "Push notifications are not supported in Expo Go on Android."
      );
      setPushEnabled(false);
      return;
    }

    if (!Notifications) {
      Alert.alert("Error", "Notifications module not loaded.");
      setPushEnabled(false);
      return;
    }

    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setPushEnabled(true);
      } else {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your system settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        setPushEnabled(false);
      }
    } else {
      setPushEnabled(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Error signing out", error.message);
    }
  };

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView styles={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: "Settings",
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
          }}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setTheme("light")}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="sunny-outline"
                  size={24}
                  color={isDark ? "#fff" : "#333"}
                />
                <Text style={styles.optionText}>Light</Text>
              </View>
              {theme === "light" && (
                <Ionicons name="checkmark" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.option}
              onPress={() => setTheme("dark")}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="moon-outline"
                  size={24}
                  color={isDark ? "#fff" : "#333"}
                />
                <Text style={styles.optionText}>Dark</Text>
              </View>
              {theme === "dark" && (
                <Ionicons name="checkmark" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.option}
              onPress={() => setTheme("system")}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={isDark ? "#fff" : "#333"}
                />
                <Text style={styles.optionText}>System</Text>
              </View>
              {theme === "system" && (
                <Ionicons name="checkmark" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.option}>
              <View style={styles.optionLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDark ? "#fff" : "#333"}
                />
                <Text style={styles.optionText}>Push Notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePushNotifications}
                trackColor={{ false: "#767577", true: "#34C759" }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Link href="/profile" asChild>
              <TouchableOpacity style={styles.option}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={isDark ? "#fff" : "#333"}
                  />
                  <Text style={styles.optionText}>Profile</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#666" : "#c7c7cc"}
                />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
      padding: 16,
    },
    header: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    headerTitle: {
      color: isDark ? "#fff" : "#000",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginBottom: 8,
      marginLeft: 12,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      overflow: "hidden",
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    optionText: {
      fontSize: 17,
      color: isDark ? "#fff" : "#000",
      marginLeft: 12,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? "#38383a" : "#c6c6c8",
      marginLeft: 52,
    },
    signOutButton: {
      marginTop: 24,
      marginBottom: 40,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },
    signOutText: {
      color: "#FF3B30",
      fontSize: 17,
      fontWeight: "600",
    },
  });
