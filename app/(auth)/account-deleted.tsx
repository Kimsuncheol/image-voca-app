import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useTheme } from "../../src/context/ThemeContext";

export default function AccountDeletedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Ionicons name="heart-outline" size={34} color="#007AFF" />
        </View>
        <Text style={styles.title}>{t("profile.deleteFlow.goodbyeTitle")}</Text>
        <Text style={styles.body}>{t("profile.deleteFlow.goodbyeBody")}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.primaryButtonText}>
            {t("profile.deleteFlow.signIn")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg.screen,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg.accentSoft,
      marginBottom: 24,
    },
    title: {
      fontSize: FontSizes.heading,
      fontWeight: FontWeights.bold,
      color: fontColors.screenTitle,
      textAlign: "center",
      marginBottom: 12,
    },
    body: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.screenMutedStrong,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 28,
    },
    primaryButton: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderRadius: 12,
      backgroundColor: bg.accent,
    },
    primaryButtonText: {
      color: fontColors.buttonOnAccent,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.bold,
    },
  });
};
