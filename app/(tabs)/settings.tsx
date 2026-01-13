import { Stack, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AccountSection } from "../../components/settings/AccountSection";
import { AppearanceSection } from "../../components/settings/AppearanceSection";
import { LanguageSection } from "../../components/settings/LanguageSection";
import { NotificationsSection } from "../../components/settings/NotificationsSection";
import { SignOutSection } from "../../components/settings/SignOutSection";
import { useTheme } from "../../src/context/ThemeContext";
import { setLanguage, SupportedLanguage } from "../../src/i18n";
import { auth } from "../../src/services/firebase";

// Dynamically require to avoid crash on Expo Go Android
let Notifications: any;
if (Platform.OS !== "android") {
  try {
    Notifications = require("expo-notifications");
  } catch (e) {
    console.warn("Failed to load expo-notifications", e);
  }
}

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (Platform.OS === "android") {
      // Skip on Android Expo Go
      return;
    }
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!Notifications) return;
    try {
      const settings = await Notifications.getPermissionsAsync();
      setPushEnabled(
        settings.granted ||
          settings.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL
      );
    } catch (e) {
      console.warn("Error checking notification status", e);
    }
  };

  const togglePushNotifications = async (value: boolean) => {
    if (Platform.OS === "android") {
      Alert.alert(
        t("settings.notifications.notSupportedTitle"),
        t("settings.notifications.notSupportedMessage")
      );
      setPushEnabled(false);
      return;
    }

    if (!Notifications) {
      Alert.alert(t("common.error"), t("settings.notifications.moduleMissing"));
      setPushEnabled(false);
      return;
    }

    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setPushEnabled(true);
      } else {
        Alert.alert(
          t("settings.notifications.permissionTitle"),
          t("settings.notifications.permissionMessage"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("settings.notifications.openSettings"),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        setPushEnabled(false);
      }
    } else {
      setPushEnabled(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert(t("settings.account.signOutError"), error.message);
    }
  };

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await setLanguage(language);
    } catch (error) {
      console.warn("Failed to change language", error);
    }
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: t("settings.title"),
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
          }}
        />

        <AppearanceSection
          styles={styles}
          isDark={isDark}
          theme={theme}
          setTheme={setTheme}
          t={t}
        />
        <NotificationsSection
          styles={styles}
          isDark={isDark}
          pushEnabled={pushEnabled}
          onTogglePush={togglePushNotifications}
          t={t}
        />
        <AccountSection styles={styles} isDark={isDark} t={t} />
        <LanguageSection
          styles={styles}
          isDark={isDark}
          currentLanguage={i18n.language}
          onChangeLanguage={handleLanguageChange}
          t={t}
        />
        <SignOutSection styles={styles} onSignOut={handleSignOut} t={t} />
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
      padding: 16,
    },
    header: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    headerTitle: {
      color: isDark ? "#fff" : "#000",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginBottom: 8,
      marginLeft: 12,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 10,
      overflow: "hidden",
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    optionText: {
      fontSize: 17,
      color: isDark ? "#fff" : "#000",
      marginLeft: 12,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? "#38383a" : "#c6c6c8",
      marginLeft: 52,
    },
    signOutButton: {
      marginTop: 24,
      marginBottom: 40,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },
    signOutText: {
      color: "#FF3B30",
      fontSize: 17,
      fontWeight: "600",
    },
  });
