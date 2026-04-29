import { FontWeights } from "@/constants/fontWeights";
/**
 * ====================================
 * SETTINGS SCREEN - Main Entry Point
 * ====================================
 *
 * This screen provides a centralized location for users to customize their app experience.
 * It includes sections for appearance, language, study preferences, notifications, and account management.
 */

// ============================================================================
// NAVIGATION & ROUTING
// ============================================================================
import { Stack, useFocusEffect, useRouter } from "expo-router"; // Stack for screen options, useRouter for navigation
import { FontSizes } from "@/constants/fontSizes";

// ============================================================================
// AUTHENTICATION
// ============================================================================
import { signOut } from "firebase/auth"; // Firebase authentication sign-out functionality

// ============================================================================
// REACT & UI FRAMEWORKS
// ============================================================================
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next"; // i18n for multilingual support
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";

// ============================================================================
// SETTINGS SECTION COMPONENTS
// ============================================================================
// Each section component represents a specific category of settings
import { AccountSection } from "../../components/settings/AccountSection"; // Account management options
import { AppearanceSection } from "../../components/settings/AppearanceSection"; // Theme and visual preferences
import { LanguageSection } from "../../components/settings/LanguageSection"; // Language selection
import { LearningLanguageSection } from "../../components/settings/LearningLanguageSection"; // Language to learn
import { NotificationsSection } from "../../components/settings/NotificationsSection"; // Study reminder settings
import { SettingsHeader } from "../../components/settings/SettingsHeader"; // Header component
import { SignOutSection } from "../../components/settings/SignOutSection"; // Sign out button
import { SpeechSection } from "../../components/settings/SpeechSection"; // Pronunciation speed settings

// ============================================================================
// CONTEXT & STATE MANAGEMENT
// ============================================================================
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useTheme } from "../../src/context/ThemeContext"; // Theme preferences context
import { setLanguage, SupportedLanguage } from "../../src/i18n"; // Language configuration
import { auth } from "../../src/services/firebase"; // Firebase auth instance
import { useDashboardSettingsStore } from "../../src/stores/dashboardSettingsStore";

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================
// Functions for managing study reminder notifications and user preferences
import {
  cancelAllScheduledNotifications, // Cancel all pending notifications
  configureNotifications, // Request notification permissions
  getNotificationPermissions, // Check current permissions status
  getStudyReminderEnabledPreference, // Get study reminder preference
  isPermissionGranted, // Check if permission is granted
  markStudyDate, // Mark today as a study date
  scheduleDailyNotifications, // Schedule daily notifications
  setStudyReminderEnabledPreference, // Save study reminder preference
} from "../../src/utils/notifications";

/**
 * ====================================
 * SETTINGS SCREEN COMPONENT
 * ====================================
 *
 * Main settings screen component that aggregates all user preferences and settings.
 * Handles state management for notifications, theme, language, and study preferences.
 */
export default function SettingsScreen() {
  // ============================================================================
  // THEME MANAGEMENT
  // ============================================================================
  // Controls light/dark mode and provides theme context to child components
  const { theme, setTheme, isDark } = useTheme();

  // ============================================================================
  // NOTIFICATION STATE
  // ============================================================================
  // Manages the state of various notification preferences
  // These are local state variables that sync with AsyncStorage preferences
  const [notificationPermissionDenied, setNotificationPermissionDenied] = useState(false); // True when user wants notifications but system permission is denied
  const [studyReminderEnabled, setStudyReminderEnabled] = useState(true); // Daily study reminder notifications

  // ============================================================================
  // NAVIGATION & INTERNATIONALIZATION
  // ============================================================================
  const router = useRouter(); // For navigation (e.g., redirecting after sign out)
  const { t, i18n } = useTranslation(); // Translation function and i18n instance

  // ============================================================================
  // USER DATA & STORES
  // ============================================================================
  const { loadSettings: loadDashboardSettings } = useDashboardSettingsStore();

  // ============================================================================
  // INITIALIZATION EFFECT
  // ============================================================================
  /**
   * Runs on component mount and when user changes
   * - Loads notification preferences from AsyncStorage
   * - Fetches user stats and subscription data from Firestore
   */
  useFocusEffect(
    useCallback(() => {
      checkNotificationStatus(); // Load notification preferences
      loadDashboardSettings(); // Load dashboard display settings
    }, [loadDashboardSettings]),
  );

  // ============================================================================
  // NOTIFICATION STATUS CHECKER
  // ============================================================================
  /**
   * Checks and syncs all notification-related preferences and permissions
   *
   * This function:
   * 1. Loads saved study reminder preference from AsyncStorage
   * 2. Checks actual system-level notification permissions
   * 3. Updates local state to reflect the combined status
   *
   * @async
   * @returns {Promise<void>}
   */
  const checkNotificationStatus = async () => {
    try {
      // Load all preferences and permissions in parallel for efficiency
      const [studyEnabled, permissions] = await Promise.all([
        getStudyReminderEnabledPreference(), // Study reminder preference
        getNotificationPermissions(), // System-level permissions
      ]);

      // Check if system permissions are granted
      const hasPermission = isPermissionGranted(permissions);

      // Show warning when the study reminder is enabled but system permission is denied
      setNotificationPermissionDenied(studyEnabled && !hasPermission);

      setStudyReminderEnabled(studyEnabled);
    } catch (e) {
      console.warn("Error checking notification status", e);
    }
  };

  // ============================================================================
  // ENABLE STUDY REMINDER NOTIFICATIONS
  // ============================================================================
  /**
   * Attempts to enable study reminder notifications by requesting system permissions
   *
   * Flow:
   * 1. Request notification permissions from the system
   * 2. If permissions module is missing, show error and abort
   * 3. If permissions are granted:
   *    - Mark today as a study date (for streak tracking)
   *    - Return true (success)
   * 4. If permissions are denied:
   *    - Show alert prompting user to open Settings
   *    - Save disabled preference
   *    - Return false (failure)
   *
   * @async
   * @returns {Promise<boolean>} True if successfully enabled, false otherwise
   */
  const enableStudyReminderNotifications = async () => {
    // Request system-level notification permissions
    const permissions = await configureNotifications();

    // Check if notification module is available (could be missing on some platforms)
    if (!permissions) {
      Alert.alert(t("common.error"), t("settings.notifications.moduleMissing"));
      setStudyReminderEnabled(false);
      return false;
    }

    // If permissions are granted, enable notifications
    if (isPermissionGranted(permissions)) {
      await markStudyDate(); // Track that user studied today (for streak calculation)
      setNotificationPermissionDenied(false);
      return true;
    }

    // If permissions are denied, show alert with option to open Settings
    Alert.alert(
      t("settings.notifications.permissionTitle"),
      t("settings.notifications.permissionMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.notifications.openSettings"),
          onPress: () => Linking.openSettings(), // Deep link to iOS/Android settings
        },
      ],
    );

    setNotificationPermissionDenied(true);
    return false;
  };

  // ============================================================================
  // DISABLE STUDY REMINDER NOTIFICATIONS
  // ============================================================================
  /**
   * Disables study reminder notifications and cancels all scheduled notifications
   *
   * This function:
   * 1. Saves disabled preference to AsyncStorage
   * 2. Cancels all pending notifications in the system queue
   * 3. Updates local state
   *
   * @async
   * @returns {Promise<void>}
   */
  const disableStudyReminderNotifications = async () => {
    await setStudyReminderEnabledPreference(false);
    await cancelAllScheduledNotifications(); // Clear notification queue
    setStudyReminderEnabled(false);
    setNotificationPermissionDenied(false);
  };

  // ============================================================================
  // STUDY REMINDER TOGGLE
  // ============================================================================
  /**
   * Toggles study reminder notifications
   *
   * @async
   * @param {boolean} value - True to enable, false to disable
   * @returns {Promise<void>}
   */
  const toggleStudyReminder = async (value: boolean) => {
    if (value) {
      const enabled = await enableStudyReminderNotifications();
      if (!enabled) {
        setStudyReminderEnabled(false); // Reset if permissions denied
        return;
      }

      await setStudyReminderEnabledPreference(true);
      setStudyReminderEnabled(true);
      await scheduleDailyNotifications();
      return;
    }

    await disableStudyReminderNotifications();
  };

  // ============================================================================
  // SIGN OUT HANDLER
  // ============================================================================
  /**
   * Signs out the current user and redirects to login screen
   *
   * Uses Firebase Auth to sign out, which clears the authentication state.
   * After successful sign out, navigates to the login screen using router.replace
   * to prevent users from navigating back.
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleSignOut = async () => {
    try {
      await signOut(auth); // Firebase sign out
      router.replace("/(auth)/login"); // Navigate to login (replace current route)
    } catch (error: any) {
      Alert.alert(t("settings.account.signOutError"), error.message);
    }
  };

  // ============================================================================
  // LANGUAGE CHANGE HANDLER
  // ============================================================================
  /**
   * Changes the app's display language
   *
   * Updates i18n configuration and saves the preference to AsyncStorage.
   * The app's UI will immediately update to display text in the selected language.
   *
   * Supported languages are defined in the i18n configuration.
   *
   * @async
   * @param {SupportedLanguage} language - Language code (e.g., 'en', 'ko', 'ja')
   * @returns {Promise<void>}
   */
  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await setLanguage(language); // Updates i18n and saves to AsyncStorage
      if (studyReminderEnabled) {
        await scheduleDailyNotifications();
      }
    } catch (error) {
      console.warn("Failed to change language", error);
    }
  };

  // ============================================================================
  // STYLES
  // ============================================================================
  // Get theme-aware styles based on dark mode preference
  const styles = getStyles(isDark);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {/* ================================================================
            SCREEN HEADER CONFIGURATION
            ================================================================
            Configures the navigation header with title and theme-aware styling
        */}
        <Stack.Screen
          options={{
            title: t("settings.title"), // Localized "Settings" title
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
          }}
        />

        {/* ================================================================
            SETTINGS HEADER
            ================================================================
            Displays user profile information and app branding
        */}
        <SettingsHeader isDark={isDark} t={t} />

        {/* ================================================================
            ACCOUNT SECTION
            ================================================================
            Account management options (profile, subscription, etc.)
        */}
        <AccountSection styles={styles} isDark={isDark} t={t} />

        {/* ================================================================
            APPEARANCE SECTION
            ================================================================
            Theme selection (Light/Dark mode)
            Allows users to customize the visual appearance of the app
        */}
        <AppearanceSection
          styles={styles}
          isDark={isDark}
          theme={theme}
          setTheme={setTheme}
          t={t}
        />

{/* ================================================================
            NOTIFICATIONS SECTION
            ================================================================
            Study reminder notification preference
        */}
        <NotificationsSection
          styles={styles}
          isDark={isDark}
          notificationPermissionDenied={notificationPermissionDenied}
          studyReminderEnabled={studyReminderEnabled}
          onToggleStudyReminder={toggleStudyReminder}
          onOpenPermissionSettings={() => Linking.openSettings()}
          t={t}
        />

        {/* ================================================================
            LANGUAGE SECTION
            ================================================================
            Language selection (English, Korean, Japanese, etc.)
            Changes the app's display language
        */}
        <LearningLanguageSection styles={styles} isDark={isDark} />

        <SpeechSection styles={styles} isDark={isDark} />

        <LanguageSection
          styles={styles}
          isDark={isDark}
          currentLanguage={i18n.language}
          onChangeLanguage={handleLanguageChange}
          t={t}
        />

        {/* ================================================================
            SIGN OUT SECTION
            ================================================================
            Sign out button
            Logs the user out and redirects to login screen
        */}
        <SignOutSection styles={styles} onSignOut={handleSignOut} t={t} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// THEME-AWARE STYLES
// ============================================================================
/**
 * Generates StyleSheet based on the current theme (light/dark mode)
 *
 * The design follows iOS/iPadOS design patterns with:
 * - Grouped list styling (cards with rounded corners)
 * - System colors that adapt to dark mode
 * - Hairline separators between options
 * - Proper spacing and typography hierarchy
 *
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {StyleSheet} Theme-aware styles object
 */
const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    // Main container - Full screen with system background color
    container: {
      flex: 1,
      backgroundColor: bg.screenAlt,
      paddingHorizontal: 16,
    },

    // Navigation header styles
    header: {
      backgroundColor: bg.card,
    },
    headerTitle: {
      color: fontColors.screenTitle,
    },

    // Section container - Groups related settings
    section: {
      marginBottom: 24, // Spacing between sections
    },

    // Section title - Uppercase label above each card
    sectionTitle: {
      fontSize: FontSizes.body,
      fontWeight: FontWeights.semiBold,
      color: fontColors.screenMuted, // System gray
      marginBottom: 8,
      marginLeft: 12, // Align with card content
      textTransform: "uppercase",
    },

    // Card - Contains one or more options in a grouped list style
    card: {
      backgroundColor: bg.surfaceElevated,
      borderRadius: 10, // Rounded corners (iOS style)
      overflow: "hidden", // Clips child content to rounded corners
    },

    // Option row - Individual setting item within a card
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // Label on left, control on right
      padding: 16,
    },

    // Left side of option - Contains icon and label
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    // Option label text
    optionText: {
      fontSize: FontSizes.subhead, // iOS standard text size
      color: fontColors.screenTitle,
      marginLeft: 8, // Spacing after icon
    },

    // Separator - Thin line between options in a card
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: bg.divider,
      marginLeft: 52, // Indent to align with option text (after icon)
    },

    // Sign out button - Standalone button outside of a card
    signOutButton: {
      marginTop: 24,
      marginBottom: 40,
      backgroundColor: bg.card,
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },

    // Sign out button text - Red color indicates destructive action
    signOutText: {
      color: fontColors.dangerAction, // iOS destructive red
      fontSize: FontSizes.subhead,
      fontWeight: FontWeights.semiBold,
    },
  });
};
