import { FontWeights } from "@/constants/fontWeights";
import { useRouter } from "expo-router";
import { FontSizes } from "@/constants/fontSizes";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { FontColors, getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { usePasswordResetDeepLink } from "../../../src/hooks/usePasswordResetDeepLink";
import { auth } from "../../../src/services/firebase";
import { sendPasswordResetEmailForAddress } from "../../../src/services/passwordResetService";
import { AuthErrorToast } from "./AuthErrorToast";
import { AuthKeyboardScreen } from "./AuthKeyboardScreen";
import { FormInput } from "./FormInput";
import { LinkButton } from "./LinkButton";
import { PasswordInput } from "./PasswordInput";
import { PrimaryButton } from "./PrimaryButton";

type PasswordResetVariant = "forgot" | "reset";

interface PasswordResetFlowProps {
  variant: PasswordResetVariant;
  initialEmail?: string;
  emailEditable: boolean;
  redirectAfterSuccess: "/(auth)/login";
}

export const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  variant,
  initialEmail = "",
  emailEditable,
  redirectAfterSuccess,
}) => {
  const router = useRouter();
  const deepLink = usePasswordResetDeepLink();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const isDeepLinkReset = variant === "reset";
  const styles = getStyles(isDark, isDeepLinkReset);

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
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    },
    [],
  );

  const isValidEmail = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const hasMinLength = password.length >= 6;
  const passwordsMatch = password === confirmPassword && password !== "";
  const canSubmitReset = hasMinLength && passwordsMatch && !!verifiedCode && !isResettingPassword;

  const scheduleLoginRedirect = useCallback((delayMs: number) => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    redirectTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        router.replace(redirectAfterSuccess);
      }
    }, delayMs);
  }, [redirectAfterSuccess, router]);

  useEffect(() => {
    if (!isDeepLinkReset) {
      return;
    }

    const oobCode = deepLink.oobCode;
    if (!oobCode || deepLink.mode !== "resetPassword") {
      setVerifiedCode(null);
      setIsVerifyingCode(false);
      setGeneralError(t("auth.passwordReset.invalidLinkToast"));
      scheduleLoginRedirect(1600);
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
        setGeneralError(t("auth.passwordReset.invalidLinkToast"));
        scheduleLoginRedirect(1600);
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
  }, [deepLink.mode, deepLink.oobCode, isDeepLinkReset, scheduleLoginRedirect, t]);

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

    setIsSendingEmail(true);
    try {
      const result = await sendPasswordResetEmailForAddress(email);
      if (!result.ok) {
        throw result.error;
      }
      setEmailSent(true);
      setSuccessMessage(t("auth.passwordReset.emailSent", { email: result.email }));
    } catch {
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

    if (!hasMinLength) {
      setGeneralError(t("auth.passwordReset.minLengthValidation"));
      return;
    }

    if (!passwordsMatch) {
      setGeneralError(t("auth.passwordReset.mismatchValidation"));
      return;
    }

    setIsResettingPassword(true);
    try {
      await confirmPasswordReset(auth, verifiedCode, password);
      setSuccessMessage(t("auth.passwordReset.successToast"));
      scheduleLoginRedirect(2000);
    } catch {
      setGeneralError(t("auth.passwordReset.resetFailed"));
    } finally {
      if (isMountedRef.current) {
        setIsResettingPassword(false);
      }
    }
  };

  const showResetForm = !!verifiedCode;
  const showForgotEmailForm = variant === "forgot";
  const showHeader = showForgotEmailForm || showResetForm;

  return (
    <AuthKeyboardScreen
      containerStyle={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {showHeader && (
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            {showResetForm
              ? t("auth.passwordReset.newPasswordTitle")
              : t("auth.passwordReset.forgotTitle")}
          </Text>
          <Text style={styles.subtitle}>
            {showResetForm
              ? t("auth.passwordReset.newPasswordSubtitle")
              : t("auth.passwordReset.forgotSubtitle")}
          </Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <AuthErrorToast
          message={generalError}
          onClose={() => setGeneralError("")}
          floating={isDeepLinkReset}
        />
        <AuthErrorToast
          message={successMessage}
          onClose={() => setSuccessMessage("")}
          floating={isDeepLinkReset}
          variant="success"
        />

        {isVerifyingCode && (
          <Text style={styles.infoText}>
            {t("auth.passwordReset.verifyingCode")}
          </Text>
        )}

        {showForgotEmailForm && (
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

            <PasswordInput
              placeholder={t("auth.passwordReset.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.validationContainer}>
              <Text style={[styles.validationText, hasMinLength && styles.validationTextValid]}>
                {t("auth.passwordReset.minLengthValidation")}
              </Text>
              <Text style={[styles.validationText, passwordsMatch && styles.validationTextValid]}>
                {t("auth.passwordReset.mismatchValidation")}
              </Text>
            </View>

            <PrimaryButton
              title={t("auth.passwordReset.submit")}
              loading={isResettingPassword}
              loadingTitle={t("auth.passwordReset.submitting")}
              onPress={handleResetPassword}
              disabled={!canSubmitReset}
            />
          </>
        )}
      </View>
    </AuthKeyboardScreen>
  );
};

const getStyles = (isDark: boolean, forceBlackBackground: boolean) => {
  const effectiveIsDark = forceBlackBackground || isDark;
  const fontColors = getFontColors(effectiveIsDark);
  const bg = getBackgroundColors(effectiveIsDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: forceBlackBackground ? "#000000" : bg.screen,
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
      fontSize: FontSizes.headingXl,
      fontWeight: FontWeights.bold,
      color: fontColors.body,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.supporting,
      textAlign: "center",
    },
    formContainer: {
      marginBottom: 24,
    },
    infoText: {
      color: fontColors.supporting,
      fontSize: FontSizes.body,
      marginBottom: 12,
      textAlign: "center",
    },
    validationContainer: {
      gap: 6,
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    validationText: {
      color: fontColors.body,
      fontSize: FontSizes.caption,
    },
    validationTextValid: {
      color: FontColors.dark.successText,
    },
    helperContainer: {
      marginTop: 16,
      alignItems: "center",
      gap: 12,
    },
    helperText: {
      color: fontColors.supporting,
      fontSize: FontSizes.label,
      textAlign: "center",
    },
  });
};

export default PasswordResetFlow;
