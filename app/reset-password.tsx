import { FontSizes } from "@/constants/fontSizes";
import React, { useEffect, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";

import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import { PasswordResetFlow } from "./(auth)/components/PasswordResetFlow";

type QueryValue = string | string[] | undefined;

const readParam = (value: QueryValue) => (Array.isArray(value) ? value[0] : value);

export const buildAppResetUrl = (params: Record<string, QueryValue>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const firstValue = readParam(value);
    if (firstValue) {
      query.set(key, firstValue);
    }
  });

  const queryString = query.toString();
  return `imagevocaapp://reset-password${queryString ? `?${queryString}` : ""}`;
};

function WebPasswordResetRedirect() {
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const appUrl = useMemo(
    () => buildAppResetUrl(params as Record<string, QueryValue>),
    [params],
  );

  useEffect(() => {
    window.location.href = appUrl;
  }, [appUrl]);

  return (
    <View style={styles.webContainer}>
      <Text style={styles.webTitle}>Open Image Voca</Text>
      <Text style={styles.webBody}>
        If the app does not open automatically, install or open Image Voca and
        request a new password reset link.
      </Text>
    </View>
  );
}

export default function ResetPasswordScreen() {
  if (Platform.OS === "web") {
    return <WebPasswordResetRedirect />;
  }

  return (
    <PasswordResetFlow
      variant="reset"
      initialEmail=""
      emailEditable={false}
      redirectAfterSuccess="/(auth)/login"
    />
  );
}

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    webContainer: {
      flex: 1,
      backgroundColor: bg.screen,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    webTitle: {
      color: fontColors.body,
      fontSize: FontSizes.headingXl,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    webBody: {
      color: fontColors.supporting,
      fontSize: FontSizes.body,
      lineHeight: FontSizes.body * 1.4,
      textAlign: "center",
    },
  });
};
