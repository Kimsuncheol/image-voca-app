import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import { FontSizes } from "@/constants/fontSizes";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getBorderColors } from "../../constants/borderColors";
import { getFontColors } from "../../constants/fontColors";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { auth, db } from "../../src/services/firebase";
import { ensureUserProfileDocument } from "../../src/services/userProfileService";
import { LearningLanguage } from "../../src/types/vocabulary";
import {
  AuthErrorToast,
  AuthKeyboardScreen,
  AuthStepIndicator,
  AuthStepTransition,
  FooterLink,
  RegisterAccountStep,
  RegisterPreferencesStep,
  RegisterSecurityStep,
} from "./components";

type RegisterStep = "account" | "security" | "preferences";
type EmailAvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

const EMAIL_AVAILABILITY_DEBOUNCE_MS = 450;

export default function RegisterScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<RegisterStep>("account");
  const [selectedLearningLanguage, setSelectedLearningLanguage] =
    useState<LearningLanguage | null>(null);
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] =
    useState<EmailAvailabilityStatus>("idle");
  // const [requestAdmin, setRequestAdmin] = useState(false);

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
  const { setLearningLanguage } = useLearningLanguage();
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
      setIsValidEmail(emailRegex.test(email.trim()));
    } else {
      setIsValidEmail(false);
    }
  }, [email]);

  useEffect(() => {
    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDisplayName || !trimmedEmail || !isValidEmail) {
      setEmailAvailabilityStatus("idle");
      return;
    }

    setEmailAvailabilityStatus("checking");

    let isActive = true;
    const timeoutId = setTimeout(() => {
      const checkEmailAvailability = async () => {
        const lowerEmail = trimmedEmail.toLowerCase();
        const emailCandidates = Array.from(
          new Set([trimmedEmail, lowerEmail]),
        );

        try {
          const snapshot = await getDocs(
            query(
              collection(db, "users"),
              where("email", "in", emailCandidates),
              limit(1),
            ),
          );

          if (!isActive) return;
          setEmailAvailabilityStatus(snapshot.empty ? "available" : "taken");
        } catch (error) {
          console.warn("Failed to check email availability", error);
          if (isActive) {
            setEmailAvailabilityStatus("error");
          }
        }
      };

      void checkEmailAvailability();
    }, EMAIL_AVAILABILITY_DEBOUNCE_MS);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [displayName, email, isValidEmail]);

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
    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDisplayName || !trimmedEmail || !password || !confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.missingFields"),
      }));
      return;
    }

    if (emailAvailabilityStatus !== "available") {
      setErrors((prev) => ({
        ...prev,
        general:
          emailAvailabilityStatus === "taken"
            ? t("auth.errors.emailAlreadyInUse")
            : t("auth.register.emailAvailability.error", {
                defaultValue:
                  "Unable to confirm this email is available. Please try again.",
              }),
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
    if (!selectedLearningLanguage) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.register.selectLearningLanguage", {
          defaultValue: "Please select at least one language to learn.",
        }),
      }));
      return;
    }

    // --- Step 5-8: Firebase registration flow ---
    setLoading(true);
    try {
      // Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      );

      // Update the user's profile with display name and avatar
      await updateProfile(userCredential.user, {
        displayName: trimmedDisplayName,
        photoURL: avatarUri || null,
      });

      // Ensure the Firestore user profile exists with app defaults.
      await ensureUserProfileDocument(userCredential.user, {
        displayName: trimmedDisplayName,
        email: trimmedEmail,
        photoURL: avatarUri || null,
        learningLanguage: selectedLearningLanguage,
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

  const handleClearDisplayName = () => {
    setDisplayName("");
  };

  const handleClearEmail = () => {
    setEmail("");
    setEmailTouched(false);
    setIsValidEmail(false);
    setEmailAvailabilityStatus("idle");
  };

  const handleLearningLanguageChange = (lang: LearningLanguage) => {
    setSelectedLearningLanguage(lang);
    void setLearningLanguage(lang);
  };

  const registerSteps: { key: RegisterStep; label: string }[] = [
    { key: "account", label: t("auth.register.steps.account") },
    { key: "security", label: t("auth.register.steps.security") },
    { key: "preferences", label: t("auth.register.steps.preferences") },
  ];

  const goToPreviousStep = () => {
    clearError();
    if (currentStep === "security") {
      setCurrentStep("account");
    } else if (currentStep === "preferences") {
      setCurrentStep("security");
    }
  };

  const handleAccountNext = () => {
    clearError();
    clearAuthError();
    if (!displayName.trim() || !email.trim()) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.missingFields"),
      }));
      return;
    }
    if (!isValidEmail) {
      setErrors((prev) => ({
        ...prev,
        general:
          t("auth.errors.invalidEmail") || "Please enter a valid email address",
      }));
      setEmailTouched(true);
      return;
    }
    if (emailAvailabilityStatus !== "available") {
      setErrors((prev) => ({
        ...prev,
        general:
          emailAvailabilityStatus === "taken"
            ? t("auth.errors.emailAlreadyInUse")
            : t("auth.register.emailAvailability.error", {
                defaultValue:
                  "Unable to confirm this email is available. Please try again.",
              }),
      }));
      return;
    }
    setCurrentStep("security");
  };

  const handleSecurityNext = () => {
    clearError();
    clearAuthError();
    if (!password || !confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.missingFields"),
      }));
      return;
    }
    if (!hasMinLength || !hasNumber || !hasSpecial) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.passwordRequirements"),
      }));
      return;
    }
    if (!passwordsMatch) {
      setErrors((prev) => ({
        ...prev,
        general: t("auth.errors.passwordMismatch"),
      }));
      return;
    }
    setCurrentStep("preferences");
  };

  const canContinueAccount =
    !!displayName.trim() &&
    !!email.trim() &&
    isValidEmail &&
    emailAvailabilityStatus === "available";
  const canContinueSecurity =
    !!password &&
    !!confirmPassword &&
    hasMinLength &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const getEmailAvailabilityMessage = () => {
    if (!email.trim() || !isValidEmail || !displayName.trim()) return "";

    if (emailAvailabilityStatus === "checking") {
      return t("auth.register.emailAvailability.checking", {
        defaultValue: "Checking email availability...",
      });
    }
    if (emailAvailabilityStatus === "available") {
      return t("auth.register.emailAvailability.available", {
        defaultValue: "This email is available.",
      });
    }
    if (emailAvailabilityStatus === "taken") {
      return t("auth.errors.emailAlreadyInUse");
    }
    if (emailAvailabilityStatus === "error") {
      return t("auth.register.emailAvailability.error", {
        defaultValue:
          "Unable to confirm this email is available. Please try again.",
      });
    }

    return "";
  };

  // ===========================================================================
  // JSX RENDER
  // ===========================================================================
  return (
    <AuthKeyboardScreen
      containerStyle={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ===================================================================
          HEADER SECTION - Title and Subtitle
          =================================================================== */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t("auth.register.title")}</Text>
        <Text style={styles.subtitle}>{t("auth.register.subtitle")}</Text>
      </View>

      <AuthErrorToast
        message={errors.general}
        onClose={() => clearError("general")}
      />

      {/* ===================================================================
      FORM CONTAINER - All form inputs and buttons
          =================================================================== */}
      <View style={styles.formContainer}>
        <AuthStepIndicator
          steps={registerSteps}
          currentStep={currentStep}
          itemMinWidth={76}
          gap={14}
        />

        <AuthStepTransition stepKey={currentStep}>
          {currentStep === "account" && (
            <RegisterAccountStep
              avatarUri={avatarUri}
              displayName={displayName}
              email={email}
              isValidEmail={isValidEmail}
              emailTouched={emailTouched}
              emailAvailabilityStatus={emailAvailabilityStatus}
              emailAvailabilityMessage={getEmailAvailabilityMessage()}
              permissionError={errors.permission}
              canContinue={canContinueAccount}
              labels={{
                avatar: t("auth.register.avatarLabel"),
                fullNamePlaceholder: t("auth.register.fullNamePlaceholder"),
                emailPlaceholder: t("auth.register.emailPlaceholder"),
                invalidEmail:
                  t("auth.errors.invalidEmail") ||
                  "Please enter a valid email address",
                next: t("common.next"),
              }}
              onPickImage={pickImage}
              onDisplayNameChange={setDisplayName}
              onDisplayNameClear={handleClearDisplayName}
              onEmailChange={setEmail}
              onEmailClear={handleClearEmail}
              onEmailBlur={() => setEmailTouched(true)}
              onNext={handleAccountNext}
            />
          )}

          {currentStep === "security" && (
            <RegisterSecurityStep
              password={password}
              confirmPassword={confirmPassword}
              hasMinLength={hasMinLength}
              hasNumber={hasNumber}
              hasSpecial={hasSpecial}
              passwordsMatch={passwordsMatch}
              canContinue={canContinueSecurity}
              labels={{
                passwordPlaceholder: t("auth.register.passwordPlaceholder"),
                confirmPasswordPlaceholder: t(
                  "auth.register.confirmPasswordPlaceholder",
                ),
                back: t("common.back"),
                next: t("common.next"),
                hints: {
                  length: t("auth.register.passwordHint.length"),
                  number: t("auth.register.passwordHint.number"),
                  special: t("auth.register.passwordHint.special"),
                  match: t("auth.register.passwordHint.match"),
                },
              }}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onBack={goToPreviousStep}
              onNext={handleSecurityNext}
            />
          )}

          {currentStep === "preferences" && (
            <RegisterPreferencesStep
              learningLanguage={selectedLearningLanguage}
              loading={loading}
              labels={{
                wishToLearn: t("settings.language.wishToLearn"),
                back: t("common.back"),
                register: t("auth.register.register"),
                creatingAccount: t("auth.register.creatingAccount"),
              }}
              onLearningLanguageChange={handleLearningLanguageChange}
              onBack={goToPreviousStep}
              onRegister={handleRegister}
            />
          )}
        </AuthStepTransition>

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

      </View>

      {/* ===================================================================
          FOOTER SECTION
          =================================================================== */}
      <FooterLink
        text={t("auth.register.hasAccount")}
        linkText={t("auth.register.signIn")}
        href="/(auth)/login"
      />
    </AuthKeyboardScreen>
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
  const borderColors = getBorderColors(isDark);
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
      fontWeight: FontWeights.bold,
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
      borderColor: borderColors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      backgroundColor: bg.cardElevated,
    },

    /** Input error state - Red border for invalid input */
    inputError: {
      borderColor: borderColors.inputBorderError,
      backgroundColor: bg.accentRedSoft,
    },

    /** Input success state - Green border for valid input */
    inputSuccess: {
      borderColor: borderColors.inputBorderSuccess,
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
      fontWeight: FontWeights.bold,
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
      fontWeight: FontWeights.bold,
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
      borderColor: borderColors.inputBorder,
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
      borderColor: borderColors.inputBorderErrorSoft,
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
      lineHeight: LineHeights.title,
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
      borderColor: borderColors.inputBorder,
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
      fontWeight: FontWeights.semiBold,
      color: fontColors.mutedLabel,
    },

    /** Admin toggle text active - When admin is selected */
    adminToggleTextActive: {
      color: fontColors.link,
    },

  });
};
