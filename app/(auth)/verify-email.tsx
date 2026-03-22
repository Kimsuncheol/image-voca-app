import { useRouter } from "expo-router";
import { sendEmailVerification, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBanner, LinkButton, PrimaryButton } from "./components";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { auth } from "../../src/services/firebase";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const { t } = useTranslation();
  const router = useRouter();
  const {
    user,
    authError,
    clearAuthError,
    refreshAuthUser,
  } = useAuth();
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCooldownSeconds((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [cooldownSeconds]);

  const handleResendVerification = async () => {
    if (!user || cooldownSeconds > 0) {
      return;
    }

    setLocalError("");
    setSuccessMessage("");
    clearAuthError();
    setResending(true);

    try {
      await sendEmailVerification(user);
      setSuccessMessage(
        t("auth.verifyEmail.emailSent", { email: user.email ?? "" }),
      );
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      console.warn("Failed to resend verification email", error);
      setLocalError(t("auth.verifyEmail.sendFailed"));
    } finally {
      setResending(false);
    }
  };

  const handleRefreshVerification = async () => {
    setLocalError("");
    setSuccessMessage("");
    clearAuthError();
    setRefreshing(true);

    try {
      await refreshAuthUser();

      if (auth.currentUser?.emailVerified !== true) {
        setLocalError(t("auth.verifyEmail.stillPending"));
      }
    } catch (error) {
      console.warn("Failed to refresh verification status", error);
      setLocalError(t("auth.verifyEmail.refreshFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  const handleUseAnotherAccount = async () => {
    setLocalError("");
    setSuccessMessage("");
    clearAuthError();

    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Failed to sign out from verification screen", error);
    }

    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <Text style={styles.title}>{t("auth.verifyEmail.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.verifyEmail.subtitle")}</Text>

          <View style={styles.emailContainer}>
            <Text style={styles.emailLabel}>{t("auth.verifyEmail.emailLabel")}</Text>
            <Text style={styles.emailValue}>{user?.email ?? t("auth.verifyEmail.emailMissing")}</Text>
          </View>

          <ErrorBanner
            title={t("auth.errors.loginTitle")}
            message={authError || localError}
            onClose={() => {
              clearAuthError();
              setLocalError("");
            }}
          />

          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <PrimaryButton
            title={t("auth.verifyEmail.verifiedAction")}
            onPress={handleRefreshVerification}
            loading={refreshing}
            loadingTitle={t("auth.verifyEmail.checking")}
          />

          <PrimaryButton
            title={
              cooldownSeconds > 0
                ? t("auth.verifyEmail.resendCooldown", { seconds: cooldownSeconds })
                : t("auth.verifyEmail.resendAction")
            }
            onPress={handleResendVerification}
            loading={resending}
            loadingTitle={t("auth.verifyEmail.resending")}
            disabled={cooldownSeconds > 0}
          />

          <LinkButton
            text={t("auth.verifyEmail.useAnotherAccount")}
            onPress={handleUseAnotherAccount}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#fff",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    cardContainer: {
      borderRadius: 24,
      backgroundColor: isDark ? "#111" : "#f7f8fa",
      paddingHorizontal: 24,
      paddingVertical: 28,
      gap: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: isDark ? "#fff" : "#111827",
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: isDark ? "#cbd5e1" : "#4b5563",
      textAlign: "center",
    },
    emailContainer: {
      gap: 4,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: isDark ? "#161616" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#262626" : "#e5e7eb",
    },
    emailLabel: {
      fontSize: 12,
      color: isDark ? "#9ca3af" : "#6b7280",
    },
    emailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#111827",
    },
    successBanner: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#1f5132" : "#b7ebc6",
      backgroundColor: isDark ? "#0d2016" : "#edfdf1",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    successText: {
      color: isDark ? "#a7f3d0" : "#166534",
      fontSize: 13,
      lineHeight: 18,
    },
  });
