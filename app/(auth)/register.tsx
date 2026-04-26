import { FontSizes } from "@/constants/fontSizes";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { auth } from "../../src/services/firebase";
import { ensureUserProfileDocument } from "../../src/services/userProfileService";
import { LearningLanguage } from "../../src/types/vocabulary";
import {
  AvatarPicker,
  Divider,
  ErrorBanner,
  FooterLink,
  FormInput,
  GoogleButton,
  PasswordHints,
  PasswordInput,
  PasswordStrengthMeter,
  PrimaryButton,
} from "./components";

export default function RegisterScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  // const [requestAdmin, setRequestAdmin] = useState(false);
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
  const { learningLanguage, setLearningLanguage } = useLearningLanguage();
  const { clearAuthError, setAuthError } = useAuth();

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
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

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
    clearAuthError();

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
        general:
          t("auth.errors.invalidEmail") || "Please enter a valid email address",
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

    // --- Step 5: Validate learning language selection ---
    if (!learningLanguage) {
      setErrors((prev) => ({
        ...prev,
        general: "Please select at least one language to learn.",
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
        password,
      );

      // Update the user's profile with display name and avatar
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: avatarUri || null,
      });

      // Ensure the Firestore user profile exists with app defaults.
      await ensureUserProfileDocument(userCredential.user, {
        displayName,
        email,
        photoURL: avatarUri || null,
        learningLanguage,
        recentCourseByLanguage: {},
      });

      try {
        await sendEmailVerification(userCredential.user);
      } catch (verificationError) {
        console.warn("Failed to send email verification after sign-up", verificationError);
        setAuthError(t("auth.verifyEmail.sendFailed"));
      }

      router.replace("/(auth)/verify-email");
    } catch (error: any) {
      // Map Firebase error codes to user-friendly messages
      let message = t("auth.errors.registerTitle");
      if (error?.code === "auth/email-already-in-use") {
        message =
          t("auth.errors.emailAlreadyInUse") ||
          "An account with this email already exists. Please sign in instead.";
      } else if (error?.code === "auth/invalid-email") {
        message =
          t("auth.errors.invalidEmail") ||
          "Please enter a valid email address.";
      } else if (error?.code === "auth/weak-password") {
        message =
          t("auth.errors.passwordRequirements") ||
          "Password does not meet requirements.";
      }
      setErrors((prev) => ({
        ...prev,
        general: message,
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
              errorMessage={
                t("auth.errors.invalidEmail") ||
                "Please enter a valid email address"
              }
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
                PASSWORD STRENGTH METER
            ----------------------------------------------------------------- */}
            <PasswordStrengthMeter
              password={password}
              hasMinLength={hasMinLength}
              hasNumber={hasNumber}
              hasSpecial={hasSpecial}
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
                LEARNING LANGUAGE SECTION
            ----------------------------------------------------------------- */}
            <View style={styles.learningSection}>
              <Text style={styles.learningSectionLabel}>
                {t("settings.language.wishToLearn")}
              </Text>
              <View style={styles.learningOptionsCard}>
                {(
                  [
                    { lang: "en", label: "English" },
                    { lang: "ja", label: "Japanese" },
                  ] as const satisfies { lang: LearningLanguage; label: string }[]
                ).map(({ lang, label }, index) => (
                  <React.Fragment key={lang}>
                    {index > 0 && (
                      <View style={styles.learningOptionSeparator} />
                    )}
                    <TouchableOpacity
                      style={styles.learningOption}
                      onPress={() => void setLearningLanguage(lang)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.learningOptionLeft}>
                        <Ionicons
                          name="globe-outline"
                          size={22}
                          color={fontColors.screenBodyStrong}
                        />
                        <Text style={styles.learningOptionText}>{label}</Text>
                      </View>
                      {learningLanguage === lang && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#007AFF"
                        />
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* -----------------------------------------------------------------
                ADMIN TOGGLE BUTTON (Development/Testing)
            ----------------------------------------------------------------- */}
            {/* <TouchableOpacity
              style={[
                styles.adminToggleButton,
                requestAdmin && styles.adminToggleButtonActive,
              ]}
              onPress={() => setRequestAdmin(!requestAdmin)}
            >
              <Text
                style={[
                  styles.adminToggleText,
                  requestAdmin && styles.adminToggleTextActive,
                ]}
              >
                {requestAdmin ? "✓ Register as Admin" : "Register as Admin"}
              </Text>
            </TouchableOpacity> */}

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
const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    // -------------------------------------------------------------------------
    // LAYOUT STYLES - Main container and structural elements
    // -------------------------------------------------------------------------

    /** Main container - Full screen with theme-aware background */
    container: {
      flex: 1,
      backgroundColor: bg.screen,
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
      fontSize: FontSizes.headingXl,
      fontWeight: "bold",
      color: fontColors.body,
      marginBottom: 8,
    },

    /** Subtitle text - Smaller, lighter color */
    subtitle: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.supporting,
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
      borderColor: fontColors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      backgroundColor: bg.cardElevated,
    },

    /** Input error state - Red border for invalid input */
    inputError: {
      borderColor: fontColors.inputBorderError,
      backgroundColor: bg.accentRedSoft,
    },

    /** Input success state - Green border for valid input */
    inputSuccess: {
      borderColor: fontColors.inputBorderSuccess,
      backgroundColor: bg.successSoft,
    },

    /** Input field icon - Spacing for icons next to inputs */
    inputIcon: {
      marginRight: 12,
    },

    /** Text input field - Flexible width, theme-aware text */
    input: {
      flex: 1,
      fontSize: FontSizes.bodyLg,
      color: fontColors.body,
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
      color: fontColors.supporting,
      fontSize: FontSizes.caption,
    },

    /** Valid hint text - Green color when requirement is met */
    hintTextValid: {
      color: fontColors.success,
    },

    // -------------------------------------------------------------------------
    // BUTTON STYLES - Primary register button
    // -------------------------------------------------------------------------

    /** Primary register button - Blue with shadow effect */
    button: {
      backgroundColor: bg.accent,
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
      color: fontColors.inverse,
      fontSize: FontSizes.bodyLg,
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
      backgroundColor: bg.subtleGray,
    },

    /** Divider text - "OR" text between divider lines */
    dividerText: {
      marginHorizontal: 16,
      color: fontColors.tertiary,
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
      backgroundColor: bg.card,
      borderWidth: 1,
      borderColor: fontColors.inputBorder,
      paddingVertical: 16,
      borderRadius: 12,
    },

    /** Google icon spacing */
    googleIcon: {
      marginRight: 12,
    },

    /** Google button text - Theme-aware text color */
    googleButtonText: {
      color: fontColors.body,
      fontSize: FontSizes.bodyLg,
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
      color: fontColors.supporting,
      fontSize: FontSizes.body,
    },

    /** Login link - Blue, bold clickable text */
    link: {
      color: fontColors.link,
      fontSize: FontSizes.body,
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
      borderRadius: 50,
      backgroundColor: bg.cardElevated,
      borderWidth: 2,
      borderColor: fontColors.inputBorder,
      borderStyle: "dashed", // Dashed border indicates clickable area
      justifyContent: "center",
      alignItems: "center",
    },

    /** Avatar label - Small text below avatar picker */
    avatarLabel: {
      fontSize: FontSizes.caption,
      color: fontColors.tertiary,
    },

    // -------------------------------------------------------------------------
    // ERROR STYLES - Error banners and inline error messages
    // -------------------------------------------------------------------------

    /** Error banner - Displayed at top of form for general/validation errors */
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: bg.dangerSoft,
      borderWidth: 1,
      borderColor: fontColors.inputBorderErrorSoft,
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
      color: fontColors.error,
      fontSize: FontSizes.body,
      lineHeight: 20,
    },

    /** Error text - Small inline error text below inputs */
    errorText: {
      color: fontColors.error,
      fontSize: FontSizes.caption,
      marginTop: 4,
      paddingHorizontal: 4,
    },

    // -------------------------------------------------------------------------
    // ADMIN TOGGLE BUTTON STYLES - Development/Testing feature
    // -------------------------------------------------------------------------

    /** Admin toggle button - Button to request admin privileges */
    adminToggleButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: fontColors.inputBorder,
      backgroundColor: bg.cardElevated,
      alignItems: "center",
      marginBottom: 16,
    },

    /** Admin toggle button active state - When admin is selected */
    adminToggleButtonActive: {
      borderColor: "#007AFF",
      backgroundColor: bg.accentBlueSoft,
    },

    /** Admin toggle text - Default text color */
    adminToggleText: {
      fontSize: FontSizes.body,
      fontWeight: "600",
      color: fontColors.mutedLabel,
    },

    /** Admin toggle text active - When admin is selected */
    adminToggleTextActive: {
      color: fontColors.link,
    },

    // -------------------------------------------------------------------------
    // LEARNING LANGUAGE STYLES
    // -------------------------------------------------------------------------
    learningSection: {
      marginBottom: 16,
    },
    learningSectionLabel: {
      fontSize: FontSizes.label,
      fontWeight: "600",
      color: fontColors.sectionMeta,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    learningOptionsCard: {
      backgroundColor: bg.cardElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: fontColors.inputBorder,
      overflow: "hidden",
    },
    learningOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    learningOptionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    learningOptionText: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.body,
    },
    learningOptionSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: bg.subtleGray,
      marginLeft: 48,
    },
  });
};
