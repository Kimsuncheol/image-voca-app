import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";

export default function DeleteAccountBeforeYouLeaveScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const removalItems = [
    t("profile.deleteFlow.removal.profile"),
    t("profile.deleteFlow.removal.devices"),
    t("profile.deleteFlow.removal.progress"),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: t("profile.deleteFlow.beforeTitle"),
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconBadge}>
          <Ionicons name="alert-circle-outline" size={34} color="#FF3B30" />
        </View>
        <Text style={styles.title}>{t("profile.deleteFlow.beforeHeading")}</Text>
        <Text style={styles.body}>{t("profile.deleteFlow.beforeBody")}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("profile.deleteFlow.removalTitle")}</Text>
          {removalItems.map((item) => (
            <View key={item} style={styles.removalRow}>
              <Ionicons name="remove-circle-outline" size={18} color="#FF3B30" />
              <Text style={styles.removalText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>{t("common.back")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => router.push("/delete-account-confirm-password")}
          >
            <Text style={styles.dangerButtonText}>
              {t("profile.deleteFlow.continue")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg.screenAlt,
    },
    header: {
      backgroundColor: bg.screenAlt,
    },
    headerTitle: {
      color: fontColors.screenTitle,
    },
    content: {
      flexGrow: 1,
      padding: 24,
      justifyContent: "center",
    },
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      backgroundColor: bg.accentRedSoft,
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
      marginBottom: 24,
    },
    card: {
      backgroundColor: bg.card,
      borderRadius: 16,
      padding: 18,
      marginBottom: 28,
    },
    cardTitle: {
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.semiBold,
      color: fontColors.screenTitle,
      marginBottom: 14,
    },
    removalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    removalText: {
      flex: 1,
      color: fontColors.screenMutedStrong,
      fontSize: FontSizes.body,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderRadius: 12,
      backgroundColor: bg.separator,
    },
    secondaryButtonText: {
      color: fontColors.screenTitle,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.semiBold,
    },
    dangerButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderRadius: 12,
      backgroundColor: bg.accentRed,
    },
    dangerButtonText: {
      color: fontColors.buttonOnAccent,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.bold,
    },
  });
};
