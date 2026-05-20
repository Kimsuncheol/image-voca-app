import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getBorderColors } from "../constants/borderColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import { deleteCurrentUserAccount } from "../src/services/accountDeletionService";

export default function DeleteAccountConfirmPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmDelete = async () => {
    if (!password) {
      setError(t("profile.delete.passwordRequired"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      await deleteCurrentUserAccount(password);
      router.replace("/(auth)/account-deleted");
    } catch (deleteError) {
      console.error("Failed to delete account", deleteError);
      setError(t("profile.delete.failed"));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: t("profile.deleteFlow.confirmTitle"),
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconBadge}>
            <Ionicons name="lock-closed-outline" size={32} color="#FF3B30" />
          </View>
          <Text style={styles.title}>{t("profile.delete.securityTitle")}</Text>
          <Text style={styles.body}>{t("profile.delete.securityMessage")}</Text>

          <TextInput
            style={styles.input}
            placeholder={t("profile.delete.passwordPlaceholder")}
            placeholderTextColor={fontColors.placeholder}
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) setError("");
            }}
            editable={!loading}
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dangerButton, loading && styles.disabledButton]}
              onPress={handleConfirmDelete}
              disabled={loading}
            >
              <Text style={styles.dangerButtonText}>
                {loading
                  ? t("profile.delete.processing")
                  : t("profile.delete.confirmButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const borderColors = getBorderColors(isDark);
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
    keyboardView: {
      flex: 1,
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
    input: {
      backgroundColor: bg.card,
      borderWidth: 1,
      borderColor: borderColors.inputBorder,
      borderRadius: 12,
      color: fontColors.screenTitle,
      fontSize: FontSizes.bodyLg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
    },
    errorText: {
      color: fontColors.error,
      fontSize: FontSizes.body,
      marginBottom: 14,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
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
    disabledButton: {
      opacity: 0.7,
    },
  });
};
