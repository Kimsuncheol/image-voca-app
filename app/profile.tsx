import { Ionicons } from "@expo/vector-icons";
import {
    launchImageLibraryAsync,
    MediaTypeOptions,
    requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { useFocusEffect, useNavigation } from "expo-router";
import {
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateProfile,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { AccountActionsSection } from "../components/profile/AccountActionsSection";
import { AccountInfoSection } from "../components/profile/AccountInfoSection";
import { LearningGoalsSection } from "../components/profile/LearningGoalsSection";
import { useTheme } from "../src/context/ThemeContext";
import { auth, storage } from "../src/services/firebase";
import { useUserStatsStore } from "../src/stores";

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const user = auth.currentUser;
  const navigation = useNavigation();

  // Daily Goal state
  const { stats, fetchStats, updateDailyGoal } = useUserStatsStore();
  const [dailyGoalInput, setDailyGoalInput] = useState("");

  // State for re-authentication
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchStats(user.uid);
      }
    }, [user])
  );

  useEffect(() => {
    if (user) {
      if (user.photoURL) setImage(user.photoURL);
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  useEffect(() => {
    if (stats) {
      setDailyGoalInput(stats.dailyGoal.toString());
    }
  }, [stats]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      Alert.alert(
        t("profile.unsaved.title"),
        t("profile.unsaved.message"),
        [
          { text: t("profile.unsaved.stay"), style: "cancel", onPress: () => {} },
          {
            text: t("profile.unsaved.discard"),
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const pickImage = async () => {
    const { status } = await requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("profile.permission.title"),
        t("profile.permission.message")
      );
      return;
    }

    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setHasUnsavedChanges(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let photoURL = user.photoURL;

      // 1. Upload image to Firebase Storage if changed (local URI)
      if (image && image !== user.photoURL && !image.startsWith("http")) {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(storageRef);
      }

      // 2. Update user profile
      await updateProfile(user, {
        photoURL: photoURL,
        displayName: displayName,
      });

      setHasUnsavedChanges(false);
      Alert.alert(t("common.success"), t("profile.save.success"));
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        t("common.error"),
        t("profile.save.error", { message: error.message })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // Use standard Alert for confirmation
    Alert.alert(
      t("profile.delete.title"),
      t("profile.delete.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.delete.confirm"),
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
          t("profile.delete.securityTitle"),
          t("profile.delete.securityMessage")
        );
        setShowPasswordInput(true);
      } else {
        Alert.alert(t("common.error"), error.message);
      }
    }
  };

  const handleReauthAndDelete = async () => {
    if (!password || !user || !user.email) {
      Alert.alert(t("common.error"), t("profile.delete.passwordRequired"));
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
        t("common.error"),
        t("profile.delete.failed")
      );
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.avatarContainer}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#fff" />
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.displayNameText}>
              {user?.displayName || t("profile.userFallback")}
            </Text>
            <Text style={styles.emailText}>{user?.email}</Text>
            {hasUnsavedChanges && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading
                    ? t("profile.save.saving")
                    : t("profile.save.saveChanges")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <AccountInfoSection
            styles={styles}
            isDark={isDark}
            displayName={displayName}
            onChangeDisplayName={(text) => {
              setDisplayName(text);
              setHasUnsavedChanges(true);
            }}
            email={user?.email}
            t={t}
          />
          <LearningGoalsSection
            styles={styles}
            isDark={isDark}
            dailyGoalInput={dailyGoalInput}
            onChangeDailyGoal={setDailyGoalInput}
            onUpdateGoal={async () => {
              const goal = parseInt(dailyGoalInput, 10);
              if (goal > 0 && user) {
                await updateDailyGoal(user.uid, goal);
                Alert.alert(t("common.success"), t("profile.goal.updated", { goal }));
              } else {
                Alert.alert(t("common.error"), t("profile.goal.invalid"));
              }
            }}
            t={t}
          />
          <AccountActionsSection
            styles={styles}
            loading={loading}
            onDeleteAccount={handleDeleteAccount}
            t={t}
          />

          {showPasswordInput && (
            <View style={styles.reauthContainer}>
              <Text style={styles.reauthTitle}>
                {t("profile.delete.confirmPassword")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("profile.delete.passwordPlaceholder")}
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
                  <Text style={styles.cancelButtonText}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleReauthAndDelete}
                  disabled={loading}
                >
                  <Text style={styles.confirmButtonText}>
                    {t("profile.delete.confirmButton")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#F2F2F7",
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      alignItems: "center",
      paddingVertical: 30,
      backgroundColor: isDark ? "#1C1C1E" : "#FFF",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      marginBottom: 20,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: isDark ? "#333" : "#FFF",
    },
    editIconContainer: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: "#007AFF",
      padding: 8,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: isDark ? "#1C1C1E" : "#FFF",
    },
    displayNameText: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFF" : "#000",
      marginBottom: 4,
    },
    emailText: {
      fontSize: 16,
      color: isDark ? "#AAA" : "#666",
      marginBottom: 16,
    },
    saveButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    saveButtonText: {
      color: "#FFF",
      fontWeight: "600",
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#AAA" : "#666",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    card: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFF",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    infoLabel: {
      fontSize: 16,
      color: isDark ? "#FFF" : "#000",
      fontWeight: "500",
    },
    infoValue: {
      fontSize: 16,
      color: isDark ? "#AAA" : "#666",
    },
    infoValueInput: {
      fontSize: 16,
      color: isDark ? "#AAA" : "#666",
      textAlign: "right",
      flex: 1,
      marginLeft: 16,
    },
    separator: {
      height: 1,
      backgroundColor: isDark ? "#333" : "#F0F0F0",
    },
    dangerOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    dangerText: {
      fontSize: 16,
      color: "#FF3B30",
      fontWeight: "600",
    },
    reauthContainer: {
      position: "absolute",
      top: "30%",
      left: 20,
      right: 20,
      backgroundColor: isDark ? "#2C2C2E" : "#FFF",
      padding: 24,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    reauthTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#FFF" : "#000",
      marginBottom: 16,
      textAlign: "center",
    },
    input: {
      backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
      padding: 12,
      borderRadius: 12,
      color: isDark ? "#FFF" : "#000",
      marginBottom: 20,
    },
    reauthButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA",
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFF" : "#000",
    },
    confirmButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: "#FF3B30",
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFF",
    },
    goalInputContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    goalInput: {
      fontSize: 16,
      color: isDark ? "#FFF" : "#000",
      backgroundColor: isDark ? "#3A3A3C" : "#F2F2F7",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      width: 60,
      textAlign: "center",
      marginRight: 8,
    },
    goalUnit: {
      fontSize: 14,
      color: isDark ? "#AAA" : "#666",
    },
    updateGoalButton: {
      backgroundColor: "#007AFF",
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 16,
    },
    updateGoalButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
