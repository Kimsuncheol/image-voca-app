import { Ionicons } from "@expo/vector-icons";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../src/context/ThemeContext";
import { auth } from "../src/services/firebase";

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  // State for re-authentication
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    // Use standard Alert for confirmation
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // If user signed in recently, this works. If not, might throw "requires-recent-login"
            performDelete();
          },
        },
      ]
    );
  };

  const performDelete = async () => {
    setLoading(true);
    try {
      await deleteUser(user!);
      // Auth state listener in _layout will redirect to login
    } catch (error: any) {
      setLoading(false);
      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Security Check",
          "Please re-enter your password to confirm account deletion."
        );
        setShowPasswordInput(true);
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  const handleReauthAndDelete = async () => {
    if (!password || !user || !user.email) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        "Error",
        "Failed to delete account. Please verify your password and try again."
      );
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.displayNameText}>
            {user?.displayName || "User"}
          </Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {user?.displayName || "Not set"}
              </Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dangerOption}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              <Text style={styles.dangerText}>
                {loading ? "Processing..." : "Delete Account"}
              </Text>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {showPasswordInput && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.reauthContainer}
          >
            <Text style={styles.reauthTitle}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#999"
            />
            <View style={styles.reauthButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleReauthAndDelete}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>Confirm Delete</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 16,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#007AFF",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    emailText: {
      fontSize: 14,
      color: isDark ? "#aaa" : "#666",
      marginTop: 4,
    },
    displayNameText: {
      fontSize: 24,
      fontWeight: "bold",
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
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      alignItems: "center",
    },
    infoLabel: {
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
    },
    infoValue: {
      fontSize: 16,
      color: isDark ? "#aaa" : "#666",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? "#38383a" : "#c6c6c8",
      marginLeft: 16,
    },
    dangerOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    dangerText: {
      fontSize: 17,
      color: "#FF3B30",
      fontWeight: "500",
    },
    reauthContainer: {
      marginTop: 20,
      padding: 20,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
    },
    reauthTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: isDark ? "#fff" : "#000",
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#ddd",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#2c2c2e" : "#f9f9f9",
    },
    reauthButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
    },
    cancelButton: {
      padding: 10,
    },
    cancelButtonText: {
      color: "#666",
    },
    confirmButton: {
      backgroundColor: "#FF3B30",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    confirmButtonText: {
      color: "#fff",
      fontWeight: "600",
    },
  });
