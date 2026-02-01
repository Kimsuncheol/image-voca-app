import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { auth, db } from "../../src/services/firebase";
import { UserRole } from "../../src/stores/subscriptionStore";
import {
  ErrorBanner,
  Divider,
  FormInput,
  PasswordInput,
  PasswordHints,
  AvatarPicker,
  PrimaryButton,
  GoogleButton,
  FooterLink,
} from "./components";

// Pre-approved admin email addresses (case-insensitive)
const ADMIN_EMAILS = ["benjaminadmin@example.com"];

export default function RegisterScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { promptAsync, loading: googleLoading } = useGoogleAuth();

  // ---------------------------------------------------------------------------
  // ERROR STATE - Inline validation error messages
  // ---------------------------------------------------------------------------
  const [errors, setErrors] = useState({
    general: "", // For Firebase and general errors at the top of the form
    permission: "", // For image picker permission errors
  });

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Email validation state
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const router = useRouter();
  const { t } = useTranslation();

  // ---------------------------------------------------------------------------
  // CLEAR ERRORS - Helper function to clear specific or all errors
  // ---------------------------------------------------------------------------
  const clearError = (field?: "general" | "permission") => {
    if (field) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } else {
      setErrors({ general: "", permission: "" });
    }
  };

  // ===========================================================================
  // EMAIL VALIDATION EFFECT
  // ===========================================================================
  /**
   * Real-time email format validation
   * Uses standard email regex pattern to validate format
   */
  useEffect(() => {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsValidEmail(emailRegex.test(email));
    } else {
      setIsValidEmail(false);
    }
  }, [email]);

  // ===========================================================================
  // PASSWORD VALIDATION EFFECT
  // ===========================================================================
  /**
   * Real-time password validation
   * Runs whenever password or confirmPassword changes to update validation states
   */
  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasNumber(/\d/.test(password));
    setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
    setPasswordsMatch(password === confirmPassword && password !== "");
  }, [password, confirmPassword]);

  // ===========================================================================
  // IMAGE PICKER FUNCTION
  // ===========================================================================
  /**
   * Opens the device's image gallery for avatar selection
   * - Requests media library permissions if not already granted
   * - Opens image picker with 1:1 aspect ratio for profile pictures
   * - Compresses image to 50% quality to reduce storage usage
   * - Shows inline error message if permission is denied
   */
  const pickImage = async () => {
    // Clear previous permission errors
    clearError("permission");

    // Request permission to access the device's media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Handle permission denial with inline error message
    if (permissionResult.granted === false) {
      setErrors((prev) => ({
        ...prev,
        permission: t("auth.errors.permissionMessage"),
      }));
      return;
    }

    // Launch the image picker with configured options
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", // Only allow image selection
      allowsEditing: true, // Enable cropping/editing
      aspect: [1, 1], // Square aspect ratio for profile pictures
      quality: 0.5, // Compress to 50% quality to save storage
    });

    // Update avatar URI if user selected an image (didn't cancel)
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // ===========================================================================
  // EMAIL/PASSWORD REGISTRATION HANDLER
  // ===========================================================================
  /**
   * Handles the email/password registration flow:
   * 1. Validates all required fields are filled
   * 2. Validates password meets security requirements
   * 3. Validates password confirmation matches
   * 4. Creates Firebase Authentication account
   * 5. Updates user profile with display name and avatar
   * 6. Creates user document in Firestore with initial data
   * 7. Navigates to main app on success
   *
   * Shows inline error messages instead of modal alerts for better UX
   */
  const handleRegister = async () => {
    // Clear previous errors
    clearError();

    // --- Step 1: Validate required fields ---
    if (!displayName || !email || !password || !confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.missingFields"),
      }));
      return;
    }

    // --- Step 2: Validate email format ---
    if (!isValidEmail) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.invalidEmail") || "Please enter a valid email address",
      }));
      setEmailTouched(true);
      return;
    }

    // --- Step 3: Validate password requirements ---
    if (!hasMinLength || !hasNumber || !hasSpecial) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.passwordRequirements"),
      }));
      return;
    }

    // --- Step 4: Validate password confirmation ---
    if (!passwordsMatch) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.passwordMismatch"),
      }));
      return;
    }

    // --- Step 5-8: Firebase registration flow ---
    setLoading(true);
    try {
      // Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user's profile with display name and avatar
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: avatarUri || null,
      });

      // Determine user role based on email (case-insensitive check)
      const role: UserRole = ADMIN_EMAILS.includes(email.toLowerCase())
        ? "admin"
        : "user";

      // Create user document in Firestore with initial data structure
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid, // Firebase user ID
        displayName: displayName, // User's display name
        email: email, // User's email address
        photoURL: avatarUri || null, // Profile picture URL (local URI)
        role: role, // User role (admin or user)
        createdAt: new Date().toISOString(), // Account creation timestamp
        wordBank: [], // Empty word bank for vocabulary learning
        recentCourse: null, // No recent course initially
      });

      // Navigate to main app (tabs) on successful registration
      router.replace("/(tabs)");
    } catch (error: any) {
      // Display Firebase error message inline
      setErrors((prev) => ({
        ...prev,
        general: error.message || t("auth.errors.registerTitle"),
      }));
    } finally {
      // Reset loading state regardless of success/failure
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
              GENERAL ERROR BANNER
              =================================================================== */}
          <ErrorBanner message={errors.general} />

          {/* ===================================================================
              FORM CONTAINER - All form inputs and buttons
              =================================================================== */}
          <View style={styles.formContainer}>

            {/* -----------------------------------------------------------------
                AVATAR PICKER SECTION
            ----------------------------------------------------------------- */}
            <AvatarPicker
              avatarUri={avatarUri}
              onPress={pickImage}
              label={t("auth.register.avatarLabel")}
              errorMessage={errors.permission}
            />
            {/* -----------------------------------------------------------------
                DISPLAY NAME INPUT
            ----------------------------------------------------------------- */}
            <FormInput
              icon="person-outline"
              placeholder={t("auth.register.fullNamePlaceholder")}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />

            {/* -----------------------------------------------------------------
                EMAIL INPUT
            ----------------------------------------------------------------- */}
            <FormInput
              icon="mail-outline"
              placeholder={t("auth.register.emailPlaceholder")}
              value={email}
              onChangeText={setEmail}
              onBlur={() => setEmailTouched(true)}
              autoCapitalize="none"
              keyboardType="email-address"
              showValidation={true}
              isValid={isValidEmail}
              isTouched={emailTouched}
              errorMessage={t("auth.errors.invalidEmail") || "Please enter a valid email address"}
            />

            {/* -----------------------------------------------------------------
                PASSWORD INPUT
            ----------------------------------------------------------------- */}
            <PasswordInput
              placeholder={t("auth.register.passwordPlaceholder")}
              value={password}
              onChangeText={setPassword}
            />

            {/* -----------------------------------------------------------------
                CONFIRM PASSWORD INPUT
            ----------------------------------------------------------------- */}
            <PasswordInput
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* -----------------------------------------------------------------
                PASSWORD VALIDATION HINTS SECTION
            ----------------------------------------------------------------- */}
            <PasswordHints
              hasMinLength={hasMinLength}
              hasNumber={hasNumber}
              hasSpecial={hasSpecial}
              passwordsMatch={passwordsMatch}
              hints={{
                length: t("auth.register.passwordHint.length"),
                number: t("auth.register.passwordHint.number"),
                special: t("auth.register.passwordHint.special"),
                match: t("auth.register.passwordHint.match"),
              }}
            />

            {/* -----------------------------------------------------------------
                REGISTER BUTTON
            ----------------------------------------------------------------- */}
            <PrimaryButton
              title={t("auth.register.register")}
              onPress={handleRegister}
              loading={loading}
              loadingTitle={t("auth.register.creatingAccount")}
            />

            {/* -----------------------------------------------------------------
                DIVIDER
            ----------------------------------------------------------------- */}
            <Divider text={t("common.or")} />

            {/* -----------------------------------------------------------------
                GOOGLE SIGN-IN BUTTON
            ----------------------------------------------------------------- */}
            <GoogleButton
              title={t("auth.register.googleSignIn")}
              onPress={handleGoogleLogin}
              loading={googleLoading}
              loadingTitle={t("auth.register.googleSigningIn")}
            />
          </View>

          {/* ===================================================================
              FOOTER SECTION
              =================================================================== */}
          <FooterLink
            text={t("auth.register.hasAccount")}
            linkText={t("auth.register.signIn")}
            href="/(auth)/login"
          />
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

    /** Input error state - Red border for invalid input */
    inputError: {
      borderColor: isDark ? "#5C2B2E" : "#DC3545",
      backgroundColor: isDark ? "#2C1618" : "#FFF5F5",
    },

    /** Input success state - Green border for valid input */
    inputSuccess: {
      borderColor: isDark ? "#1E4620" : "#28A745",
      backgroundColor: isDark ? "#0F2410" : "#F0FFF4",
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

    // -------------------------------------------------------------------------
    // ERROR STYLES - Error banners and inline error messages
    // -------------------------------------------------------------------------

    /** Error banner - Displayed at top of form for general/validation errors */
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2C1618" : "#FEE",
      borderWidth: 1,
      borderColor: isDark ? "#5C2B2E" : "#FCC",
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },

    /** Error icon - Icon displayed in error banner */
    errorIcon: {
      marginRight: 8,
    },

    /** Error banner text - Message text in error banner */
    errorBannerText: {
      flex: 1,
      color: isDark ? "#FF6B6B" : "#DC3545",
      fontSize: 14,
      lineHeight: 20,
    },

    /** Error text - Small inline error text below inputs */
    errorText: {
      color: isDark ? "#FF6B6B" : "#DC3545",
      fontSize: 12,
      marginTop: 4,
      paddingHorizontal: 4,
    },
  });
