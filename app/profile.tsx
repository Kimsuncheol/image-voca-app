import { useSubscriptionStore } from "../src/stores";
import { Ionicons } from "@expo/vector-icons";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { useNavigation } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
} from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { AccountActionsSection } from "../components/profile/AccountActionsSection";
import { AccountInfoSection } from "../components/profile/AccountInfoSection";
import { useTheme } from "../src/context/ThemeContext";
import { auth, db, storage } from "../src/services/firebase";

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const user = auth.currentUser;
  const navigation = useNavigation();
  const role = useSubscriptionStore((state) => state.role);

  // State for re-authentication
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Refresh subscription when profile screen loads to ensure role is up-to-date
  useEffect(() => {
    if (user) {
      console.log("🔄 Profile screen: Refreshing subscription for user", user.uid);
      useSubscriptionStore.getState().fetchSubscription(user.uid);
    }
  }, [user]);

  // Log role changes in profile screen for debugging
  useEffect(() => {
    console.log("👤 Profile screen: Current role =", role);
  }, [role]);

  useEffect(() => {
    if (user) {
      const nextImage = user.photoURL || null;
      const nextDisplayName = user.displayName || "";
      setImage(nextImage);
      setDisplayName(nextDisplayName);
      setInitialImage(nextImage);
      setInitialDisplayName(nextDisplayName);
      setHasUnsavedChanges(false);
    }
  }, [user]);

  useEffect(() => {
    const currentImage = image || "";
    const baseImage = initialImage || "";
    const currentName = displayName;
    const baseName = initialDisplayName;
    setHasUnsavedChanges(
      currentImage !== baseImage || currentName !== baseName,
    );
  }, [displayName, image, initialDisplayName, initialImage]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      Alert.alert(t("profile.unsaved.title"), t("profile.unsaved.message"), [
        { text: t("profile.unsaved.stay"), style: "cancel", onPress: () => {} },
        {
          text: t("profile.unsaved.discard"),
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, t]);

  const pickImage = async () => {
    const { status } = await requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("profile.permission.title"),
        t("profile.permission.message"),
      );
      return;
    }

    const result = await launchImageLibraryAsync({
      mediaTypes: "images",
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

      setInitialImage(photoURL || null);
      setInitialDisplayName(displayName);
      setImage(photoURL || null);
      setHasUnsavedChanges(false);
      Alert.alert(t("common.success"), t("profile.save.success"));
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        t("common.error"),
        t("profile.save.error", { message: error.message }),
      );
    } finally {
      setLoading(false);
    }
  };

  const cleanupUserData = async (userId: string) => {
    console.log("🧹 Starting cleanup for user:", userId);

    try {
      // Step 1: Delete profile image from Storage if it exists
      console.log("📸 Step 1: Attempting to delete profile image...");
      try {
        const profileImageRef = ref(storage, `profile_images/${userId}`);
        await deleteObject(profileImageRef);
        console.log("✅ Profile image deleted from Storage");
      } catch (storageError: any) {
        // Ignore if image doesn't exist
        if (storageError.code === "storage/object-not-found") {
          console.log("ℹ️ No profile image found in Storage (this is ok)");
        } else {
          console.warn("⚠️ Error deleting profile image:", storageError);
        }
      }

      // Step 2: Delete user document from Firestore
      console.log("📄 Step 2: Attempting to delete Firestore document...");
      await deleteDoc(doc(db, "users", userId));
      console.log("✅ User document deleted from Firestore");

      console.log("🎉 Cleanup completed successfully for user:", userId);
    } catch (error: any) {
      console.error("❌ Error cleaning up user data:", error);
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // Show confirmation first, then always require password re-authentication
    Alert.alert(t("profile.delete.title"), t("profile.delete.message"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.delete.confirm"),
        style: "destructive",
        onPress: () => setShowPasswordInput(true),
      },
    ]);
  };

  const handleReauthAndDelete = async () => {
    if (!password || !user || !user.email) {
      Alert.alert(t("common.error"), t("profile.delete.passwordRequired"));
      return;
    }
    console.log("🔐 Starting re-authentication and deletion process...");
    setLoading(true);
    try {
      console.log("🔑 Step 1: Re-authenticating user...");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      console.log("✅ Re-authentication successful");

      // Clean up Firestore and Storage data first
      console.log("🔄 Step 2: Cleaning up user data...");
      await cleanupUserData(user.uid);

      // Then delete the Firebase Auth user
      console.log("🔄 Step 3: Deleting Firebase Auth user...");
      await deleteUser(user);
      console.log("✅ Firebase Auth user deleted successfully");
      console.log("🚪 Account deletion complete, redirecting to login...");
    } catch (error: any) {
      console.error("❌ Re-authentication or deletion failed:", error);
      setLoading(false);
      Alert.alert(t("common.error"), t("profile.delete.failed"));
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
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
            }}
            email={user?.email}
            role={role}
            t={t}
          />
          <AccountActionsSection
            styles={styles}
            loading={loading}
            isAdmin={role === "admin"}
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
