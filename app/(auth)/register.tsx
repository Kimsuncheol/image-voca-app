import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
import { useTheme } from "../../src/context/ThemeContext";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { auth, db } from "../../src/services/firebase";

export default function RegisterScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { promptAsync, loading: googleLoading } = useGoogleAuth();

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasNumber(/\d/.test(password));
    setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
    setPasswordsMatch(password === confirmPassword && password !== "");
  }, [password, confirmPassword]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(
        t("auth.errors.permissionTitle"),
        t("auth.errors.permissionMessage")
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert(t("common.error"), t("auth.errors.missingFields"));
      return;
    }

    if (!hasMinLength || !hasNumber || !hasSpecial) {
      Alert.alert(t("common.error"), t("auth.errors.passwordRequirements"));
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(t("common.error"), t("auth.errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: avatarUri || null,
      });

      // Save user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: displayName,
        email: email,
        photoURL: avatarUri || null,
        createdAt: new Date().toISOString(),
        wordBank: [],
        recentCourse: null,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(t("auth.errors.registerTitle"), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    promptAsync();
  };

  // ===========================================================================
  // JSX RENDER
  // ===========================================================================
  return (
    // -------------------------------------------------------------------------
    // SAFE AREA VIEW - Handles device notches and safe areas
    // -------------------------------------------------------------------------
    <SafeAreaView style={styles.container}>
      {/* -----------------------------------------------------------------------
          KEYBOARD AVOIDING VIEW - Adjusts content when keyboard appears
          - iOS uses "padding" behavior to shift content up
          - Android uses undefined (default behavior)
      ----------------------------------------------------------------------- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        {/* ---------------------------------------------------------------------
            SCROLL VIEW - Makes form scrollable for small screens
            - Hides vertical scroll indicator for cleaner UI
            - Centers content vertically
        --------------------------------------------------------------------- */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ===================================================================
              HEADER SECTION - Title and Subtitle
              =================================================================== */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t("auth.register.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.register.subtitle")}</Text>
          </View>

          {/* ===================================================================
              FORM CONTAINER - All form inputs and buttons
              =================================================================== */}
          <View style={styles.formContainer}>

            {/* -----------------------------------------------------------------
                AVATAR PICKER SECTION
                - Allows user to select a profile picture from device gallery
                - Shows camera icon placeholder when no image selected
                - Displays selected image in circular frame
            ----------------------------------------------------------------- */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
                {avatarUri ? (
                  // Display selected image
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  // Display placeholder with camera icon
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={isDark ? "#666" : "#999"}
                    />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>
                {t("auth.register.avatarLabel")}
              </Text>
            </View>
            {/* -----------------------------------------------------------------
                DISPLAY NAME INPUT
                - Text input for user's full name
                - Auto-capitalizes each word for proper name formatting
                - Person icon indicates it's a name field
            ----------------------------------------------------------------- */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.register.fullNamePlaceholder")}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
            </View>

            {/* -----------------------------------------------------------------
                EMAIL INPUT
                - Email address input with email keyboard type
                - No auto-capitalization for email addresses
                - Mail icon indicates it's an email field
            ----------------------------------------------------------------- */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.register.emailPlaceholder")}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
            </View>

            {/* -----------------------------------------------------------------
                PASSWORD INPUT
                - Secure text entry with toggle visibility button
                - Eye icon button toggles between showing/hiding password
                - Lock icon indicates it's a password field
                - Triggers real-time validation in useEffect
            ----------------------------------------------------------------- */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.register.passwordPlaceholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
              {/* Toggle password visibility button */}
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={isDark ? "#ccc" : "#666"}
                />
              </TouchableOpacity>
            </View>

            {/* -----------------------------------------------------------------
                CONFIRM PASSWORD INPUT
                - Secure text entry with toggle visibility button
                - Must match the password field for validation
                - Eye icon button toggles between showing/hiding password
                - Lock icon indicates it's a password field
            ----------------------------------------------------------------- */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
              {/* Toggle confirm password visibility button */}
              <TouchableOpacity
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              >
                <Ionicons
                  name={
                    confirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                  }
                  size={20}
                  color={isDark ? "#ccc" : "#666"}
                />
              </TouchableOpacity>
            </View>

            {/* -----------------------------------------------------------------
                PASSWORD VALIDATION HINTS SECTION
                - Real-time visual feedback for password requirements
                - Each requirement shows checkmark when satisfied
                - Icons change from outline to checkmark-circle when valid
                - Text color changes to green when requirement is met

                Four validation requirements:
                1. Minimum 8 characters
                2. Contains at least one number
                3. Contains at least one special character
                4. Password and confirmation match
            ----------------------------------------------------------------- */}
            <View style={styles.hintsContainer}>
              {/* Minimum length requirement (8+ characters) */}
              <View style={styles.hintRow}>
                <Ionicons
                  name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={hasMinLength ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[
                    styles.hintText,
                    hasMinLength && styles.hintTextValid,
                  ]}
                >
                  {t("auth.register.passwordHint.length")}
                </Text>
              </View>

              {/* Number requirement */}
              <View style={styles.hintRow}>
                <Ionicons
                  name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={hasNumber ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[styles.hintText, hasNumber && styles.hintTextValid]}
                >
                  {t("auth.register.passwordHint.number")}
                </Text>
              </View>

              {/* Special character requirement */}
              <View style={styles.hintRow}>
                <Ionicons
                  name={hasSpecial ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={hasSpecial ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[styles.hintText, hasSpecial && styles.hintTextValid]}
                >
                  {t("auth.register.passwordHint.special")}
                </Text>
              </View>

              {/* Password match requirement */}
              <View style={styles.hintRow}>
                <Ionicons
                  name={passwordsMatch ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={passwordsMatch ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[
                    styles.hintText,
                    passwordsMatch && styles.hintTextValid,
                  ]}
                >
                  {t("auth.register.passwordHint.match")}
                </Text>
              </View>
            </View>

            {/* -----------------------------------------------------------------
                REGISTER BUTTON
                - Primary action button for email/password registration
                - Disabled and shows reduced opacity during loading
                - Button text changes to show loading state
                - Triggers handleRegister function
            ----------------------------------------------------------------- */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? t("auth.register.creatingAccount")
                  : t("auth.register.register")}
              </Text>
            </TouchableOpacity>

            {/* -----------------------------------------------------------------
                DIVIDER - "OR" Section
                - Visual separator between registration methods
                - Shows "OR" text centered between two lines
            ----------------------------------------------------------------- */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t("common.or")}</Text>
              <View style={styles.divider} />
            </View>

            {/* -----------------------------------------------------------------
                GOOGLE SIGN-IN BUTTON
                - Alternative registration method using Google OAuth
                - Shows Google logo icon
                - Disabled and shows reduced opacity during loading
                - Button text changes to show loading state
                - Triggers handleGoogleLogin function
            ----------------------------------------------------------------- */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                googleLoading && styles.buttonDisabled,
              ]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#DB4437"
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>
                {googleLoading
                  ? t("auth.register.googleSigningIn")
                  : t("auth.register.googleSignIn")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ===================================================================
              FOOTER SECTION - Link to Login
              - For users who already have an account
              - Links to login screen
              =================================================================== */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {t("auth.register.hasAccount")}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>{t("auth.register.signIn")}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES FUNCTION
// =============================================================================
/**
 * Dynamic stylesheet generator that creates theme-aware styles
 * @param isDark - Boolean indicating dark mode is active
 * @returns StyleSheet object with all component styles
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    // -------------------------------------------------------------------------
    // LAYOUT STYLES - Main container and structural elements
    // -------------------------------------------------------------------------

    /** Main container - Full screen with theme-aware background */
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#fff",
    },

    /** Keyboard avoiding view wrapper */
    keyboardView: {
      flex: 1,
    },

    /** Scroll view content container - Centers content with padding */
    scrollContent: {
      flexGrow: 1,
      padding: 24,
      justifyContent: "center",
    },

    // -------------------------------------------------------------------------
    // HEADER STYLES - Title and subtitle section
    // -------------------------------------------------------------------------

    /** Header container - Centers title and subtitle */
    headerContainer: {
      marginBottom: 32,
      alignItems: "center",
    },

    /** Main title text - Large, bold, theme-aware */
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#333",
      marginBottom: 8,
    },

    /** Subtitle text - Smaller, lighter color */
    subtitle: {
      fontSize: 16,
      color: isDark ? "#ccc" : "#666",
    },

    // -------------------------------------------------------------------------
    // FORM STYLES - Form container and input fields
    // -------------------------------------------------------------------------

    /** Form container - Groups all form elements */
    formContainer: {
      marginBottom: 24,
    },

    /** Input container - Wrapper for each input field with icon */
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
    },

    /** Input field icon - Spacing for icons next to inputs */
    inputIcon: {
      marginRight: 12,
    },

    /** Text input field - Flexible width, theme-aware text */
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? "#fff" : "#333",
    },

    // -------------------------------------------------------------------------
    // PASSWORD HINTS STYLES - Validation feedback section
    // -------------------------------------------------------------------------

    /** Hints container - Groups all password validation hints */
    hintsContainer: {
      marginBottom: 24,
      paddingHorizontal: 4,
    },

    /** Individual hint row - Icon and text for each requirement */
    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },

    /** Hint text - Default gray color for unmet requirements */
    hintText: {
      marginLeft: 8,
      color: isDark ? "#ccc" : "#666",
      fontSize: 12,
    },

    /** Valid hint text - Green color when requirement is met */
    hintTextValid: {
      color: "green",
    },

    // -------------------------------------------------------------------------
    // BUTTON STYLES - Primary register button
    // -------------------------------------------------------------------------

    /** Primary register button - Blue with shadow effect */
    button: {
      backgroundColor: "#007AFF",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: "#007AFF",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8, // Android shadow
    },

    /** Disabled button state - Reduced opacity during loading */
    buttonDisabled: {
      opacity: 0.7,
    },

    /** Button text - White, bold text */
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },

    // -------------------------------------------------------------------------
    // DIVIDER STYLES - "OR" section between registration methods
    // -------------------------------------------------------------------------

    /** Divider container - Horizontal layout with centered text */
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
    },

    /** Divider line - Thin line on either side of "OR" text */
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#333" : "#E0E0E0",
    },

    /** Divider text - "OR" text between divider lines */
    dividerText: {
      marginHorizontal: 16,
      color: isDark ? "#888" : "#999",
      fontWeight: "600",
    },

    // -------------------------------------------------------------------------
    // GOOGLE BUTTON STYLES - Google OAuth sign-in button
    // -------------------------------------------------------------------------

    /** Google sign-in button - Outlined style with theme-aware colors */
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
      paddingVertical: 16,
      borderRadius: 12,
    },

    /** Google icon spacing */
    googleIcon: {
      marginRight: 12,
    },

    /** Google button text - Theme-aware text color */
    googleButtonText: {
      color: isDark ? "#fff" : "#333",
      fontSize: 16,
      fontWeight: "600",
    },

    // -------------------------------------------------------------------------
    // FOOTER STYLES - Login link section
    // -------------------------------------------------------------------------

    /** Footer container - Centers "Already have account" text and link */
    footerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
    },

    /** Footer text - Theme-aware gray text */
    footerText: {
      color: isDark ? "#ccc" : "#666",
      fontSize: 14,
    },

    /** Login link - Blue, bold clickable text */
    link: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "bold",
    },

    // -------------------------------------------------------------------------
    // AVATAR STYLES - Profile picture picker section
    // -------------------------------------------------------------------------

    /** Avatar container - Centers avatar picker and label */
    avatarContainer: {
      alignItems: "center",
      marginBottom: 24,
    },

    /** Avatar button - Touchable wrapper for avatar picker */
    avatarButton: {
      marginBottom: 8,
    },

    /** Avatar image - Circular profile picture with border */
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50, // Makes it circular
      borderWidth: 3,
      borderColor: "#007AFF",
    },

    /** Avatar placeholder - Shown when no image is selected */
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50, // Makes it circular
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#E0E0E0",
      borderStyle: "dashed", // Dashed border indicates clickable area
      justifyContent: "center",
      alignItems: "center",
    },

    /** Avatar label - Small text below avatar picker */
    avatarLabel: {
      fontSize: 12,
      color: isDark ? "#888" : "#999",
    },
  });
