import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendEmailVerification, signOut } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBanner, LinkButton, PrimaryButton } from "./components";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { auth } from "../../src/services/firebase";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);
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
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

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

    if (!isMountedRef.current) return;
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="mail-unread-outline"
              size={80}
              color={fontColors.iconBlue}
            />
          </View>

          <Text style={styles.title}>{t("auth.verifyEmail.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.verifyEmail.subtitle")}</Text>

          <View style={styles.emailCard}>
            <Text style={styles.emailLabel}>{t("auth.verifyEmail.emailLabel")}</Text>
            <Text style={styles.emailValue}>{user?.email ?? t("auth.verifyEmail.emailMissing")}</Text>
          </View>

          <View style={styles.alertContainer}>
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
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={fontColors.iconGreenSuccess}
                  style={styles.successIcon}
                />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.buttonGroup}>
            <PrimaryButton
              title={t("auth.verifyEmail.verifiedAction")}
              onPress={handleRefreshVerification}
              loading={refreshing}
              loadingTitle={t("auth.verifyEmail.checking")}
            />

            <View style={styles.secondaryActions}>
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
            </View>

            <View style={styles.footerAction}>
              <LinkButton
                text={t("auth.verifyEmail.useAnotherAccount")}
                onPress={handleUseAnotherAccount}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg.screen,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    content: {
      alignItems: "center",
      width: "100%",
    },
    iconContainer: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: bg.verifyEmailCard,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: fontColors.screenTitleStrong,
      textAlign: "center",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      color: fontColors.screenMutedCool,
      textAlign: "center",
      paddingHorizontal: 20,
      marginBottom: 32,
    },
    emailCard: {
      width: "100%",
      padding: 20,
      borderRadius: 20,
      backgroundColor: bg.heroCard,
      borderWidth: 1,
      borderColor: fontColors.cardBorder,
      marginBottom: 24,
    },
    emailLabel: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      color: fontColors.screenMetaCool,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    emailValue: {
      fontSize: 18,
      fontWeight: "700",
      color: fontColors.verifyEmailValue,
    },
    alertContainer: {
      width: "100%",
      marginBottom: 24,
      gap: 12,
    },
    successBanner: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: fontColors.successBorder,
      backgroundColor: bg.accentGreenSoft,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    successIcon: {
      marginRight: 12,
    },
    successText: {
      flex: 1,
      color: fontColors.successText,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
    },
    buttonGroup: {
      width: "100%",
      gap: 12,
    },
    secondaryActions: {
      opacity: 0.9,
    },
    footerAction: {
      marginTop: 8,
      alignItems: "center",
    },
  });
};
