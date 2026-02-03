import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/ThemeContext";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
// import {
//   markAdminCodeAsUsed,
//   validateAdminCode,
// } from "../../src/services/adminCodeService";
import { auth, db } from "../../src/services/firebase";
import { UserRole } from "../../src/stores/subscriptionStore";
import {
  AvatarPicker,
  Divider,
  ErrorBanner,
  FooterLink,
  FormInput,
  GoogleButton,
  PasswordHints,
  PasswordInput,
  PrimaryButton,
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
  // const [adminCode, setAdminCode] = useState("");
  // const [isValidAdminCode, setIsValidAdminCode] = useState(false);
  // const [adminCodeError, setAdminCodeError] = useState("");
  // const [requestAdmin, setRequestAdmin] = useState(false);
  const { promptAsync, loading: googleLoading } = useGoogleAuth();

  // ---------------------------------------------------------------------------
  // ROLE SELECTION STATE
  // ---------------------------------------------------------------------------
  /**
   * Stores the selected user role for registration
   * - 'student': Default role for learners
   * - 'teacher': Role for educators who manage classes
   *
   * By default, new users register as 'student'
   */
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');

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
  // ADMIN CODE VALIDATION EFFECT
  // ===========================================================================
  /**
   * Real-time admin code validation
   * Validates the admin code against Firestore when user enters a code
   */
  // useEffect(() => {
  //   const validateCode = async () => {
  //     if (!adminCode) {
  //       setIsValidAdminCode(false);
  //       setAdminCodeError("");
  //       return;
  //     }

  //     const result = await validateAdminCode(adminCode);
  //     setIsValidAdminCode(result.isValid);
  //     setAdminCodeError(result.errorMessage || "");
  //   };

  //   // Debounce validation to avoid too many Firestore calls
  //   const timeoutId = setTimeout(validateCode, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [adminCode]);

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

      // ---------------------------------------------------------------------------
      // DETERMINE USER ROLE
      // ---------------------------------------------------------------------------
      /**
       * Role assignment logic:
       * 1. Check if email is in pre-approved admin list → assign 'admin' role
       * 2. Otherwise, use the role selected by user during registration
       *    - Users can choose between 'student' (learner) or 'teacher' (educator)
       *
       * Admin role can only be assigned via:
       * - Pre-approved email addresses (ADMIN_EMAILS constant)
       * - Admin invitation codes (currently commented out)
       */
      const role: UserRole = ADMIN_EMAILS.includes(email.toLowerCase())
        ? "admin"
        : selectedRole; // Use the role selected by the user ('student' or 'teacher')

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

      // Mark admin code as used if one was provided
      // if (isValidAdminCode && adminCode) {
      //   await markAdminCodeAsUsed(adminCode);
      // }

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
                ROLE SELECTION SECTION

                Allows users to choose their role during registration:
                - Student: For learners who want to study vocabulary
                - Teacher: For educators who want to manage classes and students

                This is a toggle-style selector with visual feedback showing
                which role is currently selected.
            ----------------------------------------------------------------- */}
            <View style={styles.roleSelectionContainer}>
              {/* Role selection label - Explains what this section is for */}
              <Text style={styles.roleSelectionLabel}>
                {t("auth.register.roleLabel") || "I am a..."}
              </Text>

              {/* Role selection buttons container - Horizontal layout */}
              <View style={styles.roleButtonsContainer}>
                {/* ---------------------------------------------------------------
                    STUDENT ROLE BUTTON

                    When pressed:
                    - Sets selectedRole to 'student'
                    - Visually highlights this button
                    - Dims the teacher button
                --------------------------------------------------------------- */}
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    // Apply active styling if student is selected
                    selectedRole === 'student' && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole('student')}
                  activeOpacity={0.7}
                >
                  {/* Student icon - Book/academic symbol */}
                  <Ionicons
                    name="book-outline"
                    size={24}
                    color={
                      selectedRole === 'student'
                        ? '#007AFF' // Blue when selected
                        : isDark
                        ? '#888' // Gray when not selected (dark mode)
                        : '#666' // Gray when not selected (light mode)
                    }
                    style={styles.roleIcon}
                  />
                  {/* Student role label */}
                  <Text
                    style={[
                      styles.roleButtonText,
                      selectedRole === 'student' && styles.roleButtonTextActive,
                    ]}
                  >
                    {t("auth.register.roleStudent") || "Student"}
                  </Text>
                </TouchableOpacity>

                {/* ---------------------------------------------------------------
                    TEACHER ROLE BUTTON

                    When pressed:
                    - Sets selectedRole to 'teacher'
                    - Visually highlights this button
                    - Dims the student button
                --------------------------------------------------------------- */}
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    // Apply active styling if teacher is selected
                    selectedRole === 'teacher' && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole('teacher')}
                  activeOpacity={0.7}
                >
                  {/* Teacher icon - School/education symbol */}
                  <Ionicons
                    name="school-outline"
                    size={24}
                    color={
                      selectedRole === 'teacher'
                        ? '#007AFF' // Blue when selected
                        : isDark
                        ? '#888' // Gray when not selected (dark mode)
                        : '#666' // Gray when not selected (light mode)
                    }
                    style={styles.roleIcon}
                  />
                  {/* Teacher role label */}
                  <Text
                    style={[
                      styles.roleButtonText,
                      selectedRole === 'teacher' && styles.roleButtonTextActive,
                    ]}
                  >
                    {t("auth.register.roleTeacher") || "Teacher"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Role description - Explains what the selected role means */}
              <Text style={styles.roleDescription}>
                {selectedRole === 'student'
                  ? t("auth.register.roleStudentDescription") ||
                    "Learn vocabulary and track your progress"
                  : t("auth.register.roleTeacherDescription") ||
                    "Manage classes and monitor student performance"}
              </Text>
            </View>

            {/* -----------------------------------------------------------------
                ADMIN CODE INPUT (OPTIONAL)
            ----------------------------------------------------------------- */}
            {/* <View style={styles.adminCodeContainer}>
              <Text style={styles.adminCodeLabel}>
                {t("auth.register.adminCodeLabel")}
              </Text>
              <FormInput
                icon="shield-checkmark-outline"
                placeholder={t("auth.register.adminCodePlaceholder")}
                value={adminCode}
                onChangeText={setAdminCode}
                autoCapitalize="characters"
                showValidation={adminCode.length > 0}
                isValid={isValidAdminCode}
                isTouched={adminCode.length > 0}
                errorMessage={adminCodeError}
              />
              {isValidAdminCode && (
                <View style={styles.adminCodeSuccessBadge}>
                  <Text style={styles.adminCodeSuccessText}>
                    ✓ {t("auth.register.validAdminCode")}
                  </Text>
                </View>
              )}
            </View> */}

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

    // -------------------------------------------------------------------------
    // ADMIN CODE STYLES - Optional admin code input section
    // -------------------------------------------------------------------------

    /** Admin code container - Wrapper for admin code section */
    adminCodeContainer: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
    },

    /** Admin code label - Label text above input */
    adminCodeLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginBottom: 12,
    },

    /** Admin code success badge - Shown when valid code is entered */
    adminCodeSuccessBadge: {
      marginTop: 8,
      padding: 8,
      backgroundColor: isDark ? "#0F2410" : "#F0FFF4",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#1E4620" : "#28A745",
    },

    /** Admin code success text - Text inside success badge */
    adminCodeSuccessText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#4ADE80" : "#28A745",
      textAlign: "center",
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
      borderColor: isDark ? "#333" : "#E0E0E0",
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      alignItems: "center",
      marginBottom: 16,
    },

    /** Admin toggle button active state - When admin is selected */
    adminToggleButtonActive: {
      borderColor: "#007AFF",
      backgroundColor: isDark ? "#0A1F3D" : "#E6F2FF",
    },

    /** Admin toggle text - Default text color */
    adminToggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#888" : "#666",
    },

    /** Admin toggle text active - When admin is selected */
    adminToggleTextActive: {
      color: "#007AFF",
    },

    // -------------------------------------------------------------------------
    // ROLE SELECTION STYLES - Student/Teacher role picker section
    // -------------------------------------------------------------------------

    /**
     * Role selection container - Wrapper for the entire role selection section
     * Includes label, buttons, and description
     */
    roleSelectionContainer: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
    },

    /**
     * Role selection label - "I am a..." header text
     * Positioned above the role buttons
     */
    roleSelectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginBottom: 12,
      textAlign: "center",
    },

    /**
     * Role buttons container - Horizontal flex container for student/teacher buttons
     * Equal spacing between the two role options
     */
    roleButtonsContainer: {
      flexDirection: "row",
      gap: 12, // Space between student and teacher buttons
      marginBottom: 12,
    },

    /**
     * Role button - Individual button for each role (Student or Teacher)
     * Default state: Light border, neutral colors
     * Includes icon and text vertically aligned
     */
    roleButton: {
      flex: 1, // Equal width for both buttons
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#E0E0E0",
      backgroundColor: isDark ? "#2c2c2e" : "#fff",
      alignItems: "center",
      justifyContent: "center",
    },

    /**
     * Role button active state - Visually highlights the selected role
     * Blue border and subtle background tint when selected
     */
    roleButtonActive: {
      borderColor: "#007AFF", // Blue border indicates selection
      backgroundColor: isDark ? "#0A1F3D" : "#E6F2FF", // Subtle blue background
    },

    /**
     * Role icon - Spacing for the icon within each role button
     * Icon appears above the role label text
     */
    roleIcon: {
      marginBottom: 8,
    },

    /**
     * Role button text - Label text for each role
     * Default state: Gray color for unselected roles
     */
    roleButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#888" : "#666",
    },

    /**
     * Role button text active - Text color when role is selected
     * Changes to blue to match the active button style
     */
    roleButtonTextActive: {
      color: "#007AFF",
    },

    /**
     * Role description - Explanatory text below the role buttons
     * Dynamically shows different text based on selected role
     * Helps users understand what each role does
     */
    roleDescription: {
      fontSize: 12,
      color: isDark ? "#888" : "#999",
      textAlign: "center",
      lineHeight: 16,
    },
  });
