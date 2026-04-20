import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import {
  ActionCodeSettings,
  confirmPasswordReset,
  sendPasswordResetEmail,
  signOut,
  verifyPasswordResetCode,
} from "firebase/auth";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../src/context/ThemeContext";
import { auth } from "../../../src/services/firebase";
import { ErrorBanner } from "./ErrorBanner";
import { FormInput } from "./FormInput";
import { LinkButton } from "./LinkButton";
import { PasswordHints } from "./PasswordHints";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { PrimaryButton } from "./PrimaryButton";

type PasswordResetVariant = "forgot" | "reset";

interface PasswordResetFlowProps {
  variant: PasswordResetVariant;
  initialEmail?: string;
  emailEditable: boolean;
  redirectAfterSuccess: "/(auth)/login";
}

const getFirebaseErrorCode = (error: unknown) => {
  if (error instanceof FirebaseError) {
    return error.code;
  }

  if (typeof error === "object" && error !== null) {
    const maybeCode = (error as { code?: unknown }).code;
    if (typeof maybeCode === "string") {
      return maybeCode;
    }
  }

  return undefined;
};

const shouldRetryWithoutActionCodeSettings = (code?: string) =>
  code === "auth/invalid-continue-uri" ||
  code === "auth/unauthorized-continue-uri" ||
  code === "auth/missing-continue-uri" ||
  code === "auth/argument-error";

const parsePasswordResetParams = (params: Record<string, string | string[] | undefined>) => {
  const readParam = (value?: string | string[]) => {
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const directMode = readParam(params.mode);
  const directCode = readParam(params.oobCode);
  if (directCode) {
    return {
      mode: directMode,
      oobCode: directCode,
    };
  }

  const nestedLink = readParam(params.link) || readParam(params.url);
  if (!nestedLink) {
    return {
      mode: directMode,
      oobCode: undefined,
    };
  }

  try {
    const decodedLink = decodeURIComponent(nestedLink);
    const parsedLink = new URL(decodedLink);
    return {
      mode: parsedLink.searchParams.get("mode") || directMode,
      oobCode: parsedLink.searchParams.get("oobCode") || undefined,
    };
  } catch {
    return {
      mode: directMode,
      oobCode: undefined,
    };
  }
};

export const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  variant,
  initialEmail = "",
  emailEditable,
  redirectAfterSuccess,
}) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const isValidEmail = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password !== "";

  const extractedParams = useMemo(
    () => parsePasswordResetParams(params as Record<string, string | string[] | undefined>),
    [params],
  );

  useEffect(() => {
    const oobCode = extractedParams.oobCode;
    if (!oobCode) {
      return;
    }

    if (extractedParams.mode !== "resetPassword") {
      setGeneralError(t("auth.passwordReset.verifyFailed"));
      return;
    }

    let isMounted = true;

    const verifyCode = async () => {
      setIsVerifyingCode(true);
      setGeneralError("");
      try {
        const verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
        if (!isMounted) return;

        setVerifiedCode(oobCode);
        setEmail(verifiedEmail);
      } catch {
        if (!isMounted) return;
        setVerifiedCode(null);
        setGeneralError(t("auth.passwordReset.verifyFailed"));
      } finally {
        if (isMounted) {
          setIsVerifyingCode(false);
        }
      }
    };

    void verifyCode();

    return () => {
      isMounted = false;
    };
  }, [extractedParams.mode, extractedParams.oobCode, t]);

  const handleSendVerificationEmail = async () => {
    setGeneralError("");
    setSuccessMessage("");

    if (!email) {
      setGeneralError(t("auth.passwordReset.emailRequired"));
      return;
    }

    if (!isValidEmail) {
      setGeneralError(t("auth.passwordReset.emailInvalid"));
      return;
    }

    const routePath = variant === "forgot" ? "/forgot-password" : "/reset-password";
    const iosBundleId = Constants.expoConfig?.ios?.bundleIdentifier;
    const androidPackageName = Constants.expoConfig?.android?.package;

    const actionCodeSettings: ActionCodeSettings = {
      url: Linking.createURL(routePath),
      handleCodeInApp: true,
      ...(iosBundleId ? { iOS: { bundleId: iosBundleId } } : {}),
      ...(androidPackageName
        ? {
            android: {
              packageName: androidPackageName,
              installApp: true,
            },
          }
        : {}),
    };

    setIsSendingEmail(true);
    try {
      try {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
      } catch (error) {
        const code = getFirebaseErrorCode(error);
        if (!shouldRetryWithoutActionCodeSettings(code)) {
          throw error;
        }

        // Fallback for environments where deep-link ActionCodeSettings are not accepted.
        await sendPasswordResetEmail(auth, email);
      }
      setEmailSent(true);
      setSuccessMessage(t("auth.passwordReset.emailSent", { email }));
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      setGeneralError(t("auth.passwordReset.sendFailed"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    setGeneralError("");
    setSuccessMessage("");

    if (!verifiedCode) {
      setGeneralError(t("auth.passwordReset.verifyFailed"));
      return;
    }

    if (!hasMinLength || !hasNumber || !hasSpecial) {
      setGeneralError(t("auth.errors.passwordRequirements"));
      return;
    }

    if (!passwordsMatch) {
      setGeneralError(t("auth.errors.passwordMismatch"));
      return;
    }

    setIsResettingPassword(true);
    try {
      await confirmPasswordReset(auth, verifiedCode, password);
      await signOut(auth);
      setSuccessMessage(t("auth.passwordReset.resetSuccess"));
      if (isMountedRef.current) {
        router.replace(redirectAfterSuccess);
      }
    } catch {
      setGeneralError(t("auth.passwordReset.resetFailed"));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const showResetForm = !!verifiedCode;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              {showResetForm
                ? t("auth.passwordReset.newPasswordTitle")
                : variant === "forgot"
                  ? t("auth.passwordReset.forgotTitle")
                  : t("auth.passwordReset.resetTitle")}
            </Text>
            <Text style={styles.subtitle}>
              {showResetForm
                ? t("auth.passwordReset.newPasswordSubtitle")
                : variant === "forgot"
                  ? t("auth.passwordReset.forgotSubtitle")
                  : t("auth.passwordReset.resetSubtitle")}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <ErrorBanner message={generalError} />
            {!!successMessage && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {isVerifyingCode && (
              <Text style={styles.infoText}>
                {t("auth.passwordReset.verifyingCode")}
              </Text>
            )}

            {!showResetForm && (
              <>
                <FormInput
                  icon="mail-outline"
                  placeholder={t("auth.passwordReset.emailPlaceholder")}
                  value={email}
                  onChangeText={setEmail}
                  editable={emailEditable}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  showValidation={true}
                  isTouched={email.length > 0}
                  isValid={isValidEmail}
                  errorMessage={t("auth.passwordReset.emailInvalid")}
                />

                <PrimaryButton
                  title={t("auth.passwordReset.sendEmail")}
                  loading={isSendingEmail}
                  loadingTitle={t("auth.passwordReset.sendingEmail")}
                  onPress={handleSendVerificationEmail}
                />

                {emailSent && (
                  <View style={styles.helperContainer}>
                    <Text style={styles.helperText}>
                      {t("auth.passwordReset.checkInbox")}
                    </Text>
                    <LinkButton
                      text={t("auth.passwordReset.resendEmail")}
                      onPress={handleSendVerificationEmail}
                    />
                  </View>
                )}
              </>
            )}

            {showResetForm && (
              <>
                <PasswordInput
                  placeholder={t("auth.passwordReset.passwordPlaceholder")}
                  value={password}
                  onChangeText={setPassword}
                />

                <PasswordStrengthMeter
                  password={password}
                  hasMinLength={hasMinLength}
                  hasNumber={hasNumber}
                  hasSpecial={hasSpecial}
                />

                <PasswordInput
                  placeholder={t("auth.passwordReset.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <PasswordHints
                  hasMinLength={hasMinLength}
                  hasNumber={hasNumber}
                  hasSpecial={hasSpecial}
                  passwordsMatch={passwordsMatch}
                  hints={{
                    length: t("auth.passwordReset.passwordHint.length"),
                    number: t("auth.passwordReset.passwordHint.number"),
                    special: t("auth.passwordReset.passwordHint.special"),
                    match: t("auth.passwordReset.passwordHint.match"),
                  }}
                />

                <PrimaryButton
                  title={t("auth.passwordReset.submit")}
                  loading={isResettingPassword}
                  loadingTitle={t("auth.passwordReset.submitting")}
                  onPress={handleResetPassword}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#fff",
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
      justifyContent: "center",
    },
    headerContainer: {
      marginBottom: 32,
      alignItems: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#333",
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? "#ccc" : "#666",
      textAlign: "center",
    },
    formContainer: {
      marginBottom: 24,
    },
    successBanner: {
      backgroundColor: isDark ? "#113A1A" : "#E8F7EC",
      borderColor: isDark ? "#1F6A2F" : "#9CD7AC",
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    successText: {
      color: isDark ? "#B8F5C4" : "#1D6B2F",
      fontSize: 13,
      fontWeight: "600",
    },
    infoText: {
      color: isDark ? "#ccc" : "#666",
      fontSize: 14,
      marginBottom: 12,
      textAlign: "center",
    },
    helperContainer: {
      marginTop: 16,
      alignItems: "center",
      gap: 12,
    },
    helperText: {
      color: isDark ? "#ccc" : "#666",
      fontSize: 13,
      textAlign: "center",
    },
  });

export default PasswordResetFlow;
