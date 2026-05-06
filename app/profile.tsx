import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { FontSizes } from "@/constants/fontSizes";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { updateProfile } from "firebase/auth";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountActionsSection } from "../components/profile/AccountActionsSection";
import { AccountInfoSection } from "../components/profile/AccountInfoSection";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import { auth, storage } from "../src/services/firebase";
import { useSubscriptionStore } from "../src/stores";
import { getDeviceCountryDisplayName } from "../src/utils/deviceCountry";

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
  const router = useRouter();
  const role = useSubscriptionStore((state) => state.role);
  const country = getDeviceCountryDisplayName();

  // Refresh subscription when profile screen loads to ensure role is up-to-date
  useEffect(() => {
    if (user) {
      console.log(
        "🔄 Profile screen: Refreshing subscription for user",
        user.uid,
      );
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    router.push("/delete-account-before-you-leave");
  };

  const handleResetPassword = () => {
    router.push("/(auth)/reset-password");
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
            country={country}
            role={role}
            t={t}
          />
          <AccountActionsSection
            styles={styles}
            loading={loading}
            isAdmin={role.includes("admin")}
            onResetPassword={handleResetPassword}
            onDeleteAccount={handleDeleteAccount}
            t={t}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg.screenAlt,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      alignItems: "center",
      paddingVertical: 30,
      backgroundColor: bg.card,
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
      borderColor: fontColors.avatarBorder,
    },
    editIconContainer: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: bg.accent,
      padding: 8,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: fontColors.surfaceBorder,
    },
    displayNameText: {
      fontSize: FontSizes.heading,
      fontWeight: FontWeights.bold,
      color: fontColors.screenTitle,
      marginBottom: 4,
    },
    emailText: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.screenMutedStrong,
      marginBottom: 16,
    },
    saveButton: {
      backgroundColor: bg.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    saveButtonText: {
      color: fontColors.buttonOnAccent,
      fontWeight: FontWeights.semiBold,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: FontSizes.body,
      fontWeight: FontWeights.semiBold,
      color: fontColors.screenMutedStrong,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    card: {
      backgroundColor: bg.card,
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
      fontSize: FontSizes.bodyLg,
      color: fontColors.screenTitle,
      fontWeight: FontWeights.medium,
    },
    infoValue: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.screenMutedStrong,
    },
    infoValueInput: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.screenMutedStrong,
      textAlign: "right",
      flex: 1,
      marginLeft: 16,
    },
    separator: {
      height: 1,
      backgroundColor: bg.subtleGrayLight,
    },
    dangerOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    actionOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    actionText: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.screenTitle,
      fontWeight: FontWeights.semiBold,
    },
    dangerText: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.dangerAction,
      fontWeight: FontWeights.semiBold,
    },
    goalInputContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    goalInput: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.screenTitle,
      backgroundColor: bg.inputAlt,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      width: 60,
      textAlign: "center",
      marginRight: 8,
    },
    goalUnit: {
      fontSize: FontSizes.body,
      color: fontColors.screenMutedStrong,
    },
    updateGoalButton: {
      backgroundColor: bg.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 16,
    },
    updateGoalButtonText: {
      color: fontColors.buttonOnAccent,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.semiBold,
    },
  });
};
