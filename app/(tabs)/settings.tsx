import { Stack, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import { AccountSection } from "../../components/settings/AccountSection";
import { AdminSection } from "../../components/settings/AdminSection";
import { AppearanceSection } from "../../components/settings/AppearanceSection";
import { LanguageSection } from "../../components/settings/LanguageSection";
import { NotificationsSection } from "../../components/settings/NotificationsSection";
import { SignOutSection } from "../../components/settings/SignOutSection";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { setLanguage, SupportedLanguage } from "../../src/i18n";
import { auth } from "../../src/services/firebase";
import {
  cancelAllScheduledNotifications,
  configureNotifications,
  getNotificationPermissions,
  getNotificationsEnabledPreference,
  getPopWordEnabledPreference,
  getStudyReminderEnabledPreference,
  isPermissionGranted,
  markStudyDate,
  scheduleDailyNotifications,
  setNotificationsEnabledPreference,
  setPopWordEnabledPreference,
  setStudyReminderEnabledPreference,
} from "../../src/utils/notifications";

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [studyReminderEnabled, setStudyReminderEnabled] = useState(true);
  const [popWordEnabled, setPopWordEnabled] = useState(true);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const [preferencesEnabled, studyEnabled, popEnabled, permissions] =
        await Promise.all([
          getNotificationsEnabledPreference(),
          getStudyReminderEnabledPreference(),
          getPopWordEnabledPreference(),
          getNotificationPermissions(),
        ]);
      const hasPermission = isPermissionGranted(permissions);
      setPushEnabled(preferencesEnabled && hasPermission);
      setStudyReminderEnabled(studyEnabled);
      setPopWordEnabled(popEnabled);
    } catch (e) {
      console.warn("Error checking notification status", e);
    }
  };

  const enablePushNotifications = async () => {
    const permissions = await configureNotifications();
    if (!permissions) {
      Alert.alert(t("common.error"), t("settings.notifications.moduleMissing"));
      setPushEnabled(false);
      return false;
    }

    if (isPermissionGranted(permissions)) {
      await markStudyDate();
      await setNotificationsEnabledPreference(true);
      setPushEnabled(true);
      await scheduleDailyNotifications(user?.uid);
      return true;
    }

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
    await setNotificationsEnabledPreference(false);
    setPushEnabled(false);
    return false;
  };

  const disablePushNotifications = async () => {
    await setNotificationsEnabledPreference(false);
    await cancelAllScheduledNotifications();
    setPushEnabled(false);
  };

  const togglePushNotifications = async (value: boolean) => {
    if (value) {
      const enabled = await enablePushNotifications();
      if (!enabled) return;
      await Promise.all([
        setStudyReminderEnabledPreference(true),
        setPopWordEnabledPreference(true),
      ]);
      setStudyReminderEnabled(true);
      setPopWordEnabled(true);
      await scheduleDailyNotifications(user?.uid);
      return;
    }
    await disablePushNotifications();
  };

  const toggleStudyReminder = async (value: boolean) => {
    if (value && !pushEnabled) {
      const enabled = await enablePushNotifications();
      if (!enabled) {
        setStudyReminderEnabled(false);
        return;
      }
    }
    await setStudyReminderEnabledPreference(value);
    setStudyReminderEnabled(value);
    if (!value && !popWordEnabled) {
      await disablePushNotifications();
      return;
    }
    await scheduleDailyNotifications(user?.uid);
  };

  const togglePopWord = async (value: boolean) => {
    if (value && !pushEnabled) {
      const enabled = await enablePushNotifications();
      if (!enabled) {
        setPopWordEnabled(false);
        return;
      }
    }
    await setPopWordEnabledPreference(value);
    setPopWordEnabled(value);
    if (!value && !studyReminderEnabled) {
      await disablePushNotifications();
      return;
    }
    await scheduleDailyNotifications(user?.uid);
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
          studyReminderEnabled={studyReminderEnabled}
          popWordEnabled={popWordEnabled}
          onTogglePush={togglePushNotifications}
          onToggleStudyReminder={toggleStudyReminder}
          onTogglePopWord={togglePopWord}
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

        <AdminSection styles={styles} user={user} t={t} />

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
      marginLeft: 8,
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
