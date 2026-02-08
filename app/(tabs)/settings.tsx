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
import { Stack, useRouter } from "expo-router"; // Stack for screen options, useRouter for navigation

// ============================================================================
// AUTHENTICATION
// ============================================================================
import { signOut } from "firebase/auth"; // Firebase authentication sign-out functionality

// ============================================================================
// REACT & UI FRAMEWORKS
// ============================================================================
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"; // i18n for multilingual support
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";

// ============================================================================
// SETTINGS SECTION COMPONENTS
// ============================================================================
// Each section component represents a specific category of settings
import { AccountSection } from "../../components/settings/AccountSection"; // Account management options
import { AdminSection } from "../../components/settings/AdminSection"; // Admin-only features
import { AppearanceSection } from "../../components/settings/AppearanceSection"; // Theme and visual preferences
import { LanguageSection } from "../../components/settings/LanguageSection"; // Language selection
import { NotificationsSection } from "../../components/settings/NotificationsSection"; // Push notification settings
import { PopQuizType } from "../../components/settings/PopQuizTypeModal"; // Type definition for quiz types
import { PopQuizTypeSection } from "../../components/settings/PopQuizTypeSection"; // Pop quiz type selection
import { SettingsHeader } from "../../components/settings/SettingsHeader"; // Header component
import { SignOutSection } from "../../components/settings/SignOutSection"; // Sign out button
import { StudySection } from "../../components/settings/StudySection"; // Study-related preferences

// ============================================================================
// CONTEXT & STATE MANAGEMENT
// ============================================================================
import { useAuth } from "../../src/context/AuthContext"; // User authentication context
import { useTheme } from "../../src/context/ThemeContext"; // Theme preferences context
import { setLanguage, SupportedLanguage } from "../../src/i18n"; // Language configuration
import { auth } from "../../src/services/firebase"; // Firebase auth instance
import {
  usePopQuizPreferencesStore,
  useSubscriptionStore,
  useUserStatsStore,
} from "../../src/stores"; // Zustand stores

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================
// Functions for managing push notifications and user preferences
import {
  cancelAllScheduledNotifications, // Cancel all pending notifications
  configureNotifications, // Request notification permissions
  getNotificationPermissions, // Check current permissions status
  getNotificationsEnabledPreference, // Get master notification toggle state
  getPopWordEnabledPreference, // Get pop word notification preference
  getStudyReminderEnabledPreference, // Get study reminder preference
  isPermissionGranted, // Check if permission is granted
  markStudyDate, // Mark today as a study date
  scheduleDailyNotifications, // Schedule daily notifications
  setNotificationsEnabledPreference, // Save master notification toggle
  setPopWordEnabledPreference, // Save pop word preference
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
  const [pushEnabled, setPushEnabled] = useState(false); // Master notification toggle
  const [studyReminderEnabled, setStudyReminderEnabled] = useState(true); // Daily study reminder notifications
  const [popWordEnabled, setPopWordEnabled] = useState(true); // Pop word quiz notifications

  // ============================================================================
  // POP QUIZ PREFERENCES
  // ============================================================================
  // Manages the type of pop quiz displayed on the dashboard
  // Types include: multiple-choice, fill-in-blank, word-arrangement, matching
  const {
    quizType: popQuizType,
    setQuizType: setPopQuizTypeStore,
    loadQuizType,
  } = usePopQuizPreferencesStore();

  // ============================================================================
  // NAVIGATION & INTERNATIONALIZATION
  // ============================================================================
  const router = useRouter(); // For navigation (e.g., redirecting after sign out)
  const { t, i18n } = useTranslation(); // Translation function and i18n instance

  // ============================================================================
  // USER DATA & STORES
  // ============================================================================
  const { user } = useAuth(); // Current authenticated user
  const { stats, fetchStats, updateTargetScore } = useUserStatsStore(); // User statistics and target score
  const { fetchSubscription } = useSubscriptionStore(); // User subscription status

  // ============================================================================
  // INITIALIZATION EFFECT
  // ============================================================================
  /**
   * Runs on component mount and when user changes
   * - Loads notification preferences from AsyncStorage
   * - Loads pop quiz type preference
   * - Fetches user stats and subscription data from Firestore
   */
  useEffect(() => {
    checkNotificationStatus(); // Load notification preferences
    loadPopQuizType(); // Load saved quiz type preference
    if (user) {
      fetchStats(user.uid); // Fetch user statistics
      fetchSubscription(user.uid); // Fetch subscription status
    }
  }, [user, fetchStats, fetchSubscription]);

  // ============================================================================
  // POP QUIZ TYPE LOADING
  // ============================================================================
  /**
   * Loads the user's saved pop quiz type preference from AsyncStorage
   * Called on component mount in the useEffect hook
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadPopQuizType = async () => {
    try {
      await loadQuizType(); // Loads from store which reads from AsyncStorage
    } catch (e) {
      console.warn("Error loading pop quiz type preference", e);
    }
  };

  // ============================================================================
  // NOTIFICATION STATUS CHECKER
  // ============================================================================
  /**
   * Checks and syncs all notification-related preferences and permissions
   *
   * This function:
   * 1. Loads saved preferences from AsyncStorage (master toggle, study reminder, pop word)
   * 2. Checks actual system-level notification permissions
   * 3. Updates local state to reflect the combined status
   *
   * The master push toggle is only enabled if BOTH conditions are met:
   * - User has previously enabled notifications in preferences
   * - System permissions are granted
   *
   * @async
   * @returns {Promise<void>}
   */
  const checkNotificationStatus = async () => {
    try {
      // Load all preferences and permissions in parallel for efficiency
      const [preferencesEnabled, studyEnabled, popEnabled, permissions] =
        await Promise.all([
          getNotificationsEnabledPreference(), // Master notification toggle
          getStudyReminderEnabledPreference(), // Study reminder preference
          getPopWordEnabledPreference(), // Pop word notification preference
          getNotificationPermissions(), // System-level permissions
        ]);

      // Check if system permissions are granted
      const hasPermission = isPermissionGranted(permissions);

      // Master toggle is only enabled if both preference AND permission are true
      setPushEnabled(preferencesEnabled && hasPermission);

      // Individual notification types reflect saved preferences
      setStudyReminderEnabled(studyEnabled);
      setPopWordEnabled(popEnabled);
    } catch (e) {
      console.warn("Error checking notification status", e);
    }
  };

  // ============================================================================
  // ENABLE PUSH NOTIFICATIONS
  // ============================================================================
  /**
   * Attempts to enable push notifications by requesting system permissions
   *
   * Flow:
   * 1. Request notification permissions from the system
   * 2. If permissions module is missing, show error and abort
   * 3. If permissions are granted:
   *    - Mark today as a study date (for streak tracking)
   *    - Save enabled preference to AsyncStorage
   *    - Schedule daily notifications
   *    - Return true (success)
   * 4. If permissions are denied:
   *    - Show alert prompting user to open Settings
   *    - Save disabled preference
   *    - Return false (failure)
   *
   * @async
   * @returns {Promise<boolean>} True if successfully enabled, false otherwise
   */
  const enablePushNotifications = async () => {
    // Request system-level notification permissions
    const permissions = await configureNotifications();

    // Check if notification module is available (could be missing on some platforms)
    if (!permissions) {
      Alert.alert(t("common.error"), t("settings.notifications.moduleMissing"));
      setPushEnabled(false);
      return false;
    }

    // If permissions are granted, enable notifications
    if (isPermissionGranted(permissions)) {
      await markStudyDate(); // Track that user studied today (for streak calculation)
      await setNotificationsEnabledPreference(true); // Save preference to AsyncStorage
      setPushEnabled(true); // Update local state
      await scheduleDailyNotifications(user?.uid); // Schedule recurring notifications
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

    // Save disabled state since permissions were denied
    await setNotificationsEnabledPreference(false);
    setPushEnabled(false);
    return false;
  };

  // ============================================================================
  // DISABLE PUSH NOTIFICATIONS
  // ============================================================================
  /**
   * Disables push notifications and cancels all scheduled notifications
   *
   * This function:
   * 1. Saves disabled preference to AsyncStorage
   * 2. Cancels all pending notifications in the system queue
   * 3. Updates local state
   *
   * @async
   * @returns {Promise<void>}
   */
  const disablePushNotifications = async () => {
    await setNotificationsEnabledPreference(false); // Save preference
    await cancelAllScheduledNotifications(); // Clear notification queue
    setPushEnabled(false); // Update local state
  };

  // ============================================================================
  // MASTER NOTIFICATION TOGGLE
  // ============================================================================
  /**
   * Toggles master push notification setting
   *
   * When enabling:
   * - Requests permissions and enables notifications
   * - Auto-enables both study reminder and pop word notifications
   * - Schedules daily notifications
   *
   * When disabling:
   * - Disables all notifications and clears scheduled notifications
   *
   * @async
   * @param {boolean} value - True to enable, false to disable
   * @returns {Promise<void>}
   */
  const togglePushNotifications = async (value: boolean) => {
    if (value) {
      // Attempt to enable notifications (requests permissions)
      const enabled = await enablePushNotifications();
      if (!enabled) return; // Abort if permissions denied

      // Enable both notification types by default
      await Promise.all([
        setStudyReminderEnabledPreference(true),
        setPopWordEnabledPreference(true),
      ]);
      setStudyReminderEnabled(true);
      setPopWordEnabled(true);

      // Schedule notifications
      await scheduleDailyNotifications(user?.uid);
      return;
    }

    // Disable all notifications
    await disablePushNotifications();
  };

  // ============================================================================
  // STUDY REMINDER TOGGLE
  // ============================================================================
  /**
   * Toggles study reminder notifications
   *
   * Dependencies:
   * - If enabling and push is disabled, will first request push permissions
   * - If disabling and pop word is also disabled, will disable push entirely
   *
   * This ensures the master push toggle reflects whether ANY notification type is enabled
   *
   * @async
   * @param {boolean} value - True to enable, false to disable
   * @returns {Promise<void>}
   */
  const toggleStudyReminder = async (value: boolean) => {
    // If enabling and push not enabled, request permissions first
    if (value && !pushEnabled) {
      const enabled = await enablePushNotifications();
      if (!enabled) {
        setStudyReminderEnabled(false); // Reset if permissions denied
        return;
      }
    }

    // Save preference and update state
    await setStudyReminderEnabledPreference(value);
    setStudyReminderEnabled(value);

    // If disabling and pop word is also disabled, disable push entirely
    if (!value && !popWordEnabled) {
      await disablePushNotifications();
      return;
    }

    // Reschedule notifications with new preferences
    await scheduleDailyNotifications(user?.uid);
  };

  // ============================================================================
  // POP WORD NOTIFICATION TOGGLE
  // ============================================================================
  /**
   * Toggles pop word (vocabulary quiz) notifications
   *
   * Dependencies:
   * - If enabling and push is disabled, will first request push permissions
   * - If disabling and study reminder is also disabled, will disable push entirely
   *
   * This ensures the master push toggle reflects whether ANY notification type is enabled
   *
   * @async
   * @param {boolean} value - True to enable, false to disable
   * @returns {Promise<void>}
   */
  const togglePopWord = async (value: boolean) => {
    // If enabling and push not enabled, request permissions first
    if (value && !pushEnabled) {
      const enabled = await enablePushNotifications();
      if (!enabled) {
        setPopWordEnabled(false); // Reset if permissions denied
        return;
      }
    }

    // Save preference and update state
    await setPopWordEnabledPreference(value);
    setPopWordEnabled(value);

    // If disabling and study reminder is also disabled, disable push entirely
    if (!value && !studyReminderEnabled) {
      await disablePushNotifications();
      return;
    }

    // Reschedule notifications with new preferences
    await scheduleDailyNotifications(user?.uid);
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
    } catch (error) {
      console.warn("Failed to change language", error);
    }
  };

  // ============================================================================
  // TARGET SCORE UPDATE HANDLER
  // ============================================================================
  /**
   * Updates the user's target score for daily pop quizzes
   *
   * The target score determines how many questions appear in daily pop quizzes.
   * This value is saved to Firestore and synced across devices.
   *
   * @async
   * @param {number} score - New target score (number of questions per quiz)
   * @returns {Promise<void>}
   */
  const handleUpdateTargetScore = async (score: number) => {
    if (user) {
      await updateTargetScore(user.uid, score); // Updates Firestore
    }
  };

  // ============================================================================
  // POP QUIZ TYPE CHANGE HANDLER
  // ============================================================================
  /**
   * Changes the type of pop quiz displayed on the dashboard
   *
   * Available quiz types:
   * - multiple-choice: Select correct answer from 4 options
   * - fill-in-blank: Complete the sentence with the correct word
   * - word-arrangement: Arrange words to form correct sentence
   * - matching: Match 4 words with their meanings
   *
   * The preference is saved to AsyncStorage and applies to dashboard pop quizzes.
   *
   * @async
   * @param {PopQuizType} type - The quiz type to set
   * @returns {Promise<void>}
   */
  const handlePopQuizTypeChange = async (type: PopQuizType) => {
    try {
      await setPopQuizTypeStore(type); // Saves to AsyncStorage via Zustand store
    } catch (error) {
      console.warn("Failed to change pop quiz type", error);
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
            STUDY SECTION
            ================================================================
            Target score configuration for daily pop quizzes
            Users can set how many questions they want in their daily quizzes
        */}
        <StudySection
          styles={styles}
          isDark={isDark}
          targetScore={stats?.targetScore || 10} // Default to 10 if not set
          onUpdateTargetScore={handleUpdateTargetScore}
          t={t}
        />

        {/* ================================================================
            POP QUIZ TYPE SECTION
            ================================================================
            Quiz type selection (multiple-choice, fill-in-blank, etc.)
            Determines the format of pop quizzes on the dashboard
        */}
        <PopQuizTypeSection
          styles={styles}
          isDark={isDark}
          currentType={popQuizType}
          onChangeType={handlePopQuizTypeChange}
          t={t}
        />

        {/* ================================================================
            NOTIFICATIONS SECTION
            ================================================================
            Push notification preferences:
            - Master notification toggle
            - Study reminder notifications
            - Pop word (vocabulary quiz) notifications
        */}
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

        {/* ================================================================
            ACCOUNT SECTION
            ================================================================
            Account management options (profile, subscription, etc.)
        */}
        <AccountSection styles={styles} isDark={isDark} t={t} />

        {/* ================================================================
            LANGUAGE SECTION
            ================================================================
            Language selection (English, Korean, Japanese, etc.)
            Changes the app's display language
        */}
        <LanguageSection
          styles={styles}
          isDark={isDark}
          currentLanguage={i18n.language}
          onChangeLanguage={handleLanguageChange}
          t={t}
        />

        {/* ================================================================
            ADMIN SECTION
            ================================================================
            Admin-only features (only visible to admin users)
            Provides access to administrative functions
        */}
        <AdminSection styles={styles} t={t} isDark={isDark} />

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
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    // Main container - Full screen with system background color
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7", // System background (iOS style)
      paddingHorizontal: 16,
    },

    // Navigation header styles
    header: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    headerTitle: {
      color: isDark ? "#fff" : "#000",
    },

    // Section container - Groups related settings
    section: {
      marginBottom: 24, // Spacing between sections
    },

    // Section title - Uppercase label above each card
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#8e8e93" : "#6e6e73", // System gray
      marginBottom: 8,
      marginLeft: 12, // Align with card content
      textTransform: "uppercase",
    },

    // Card - Contains one or more options in a grouped list style
    card: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff", // Elevated surface
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
      fontSize: 17, // iOS standard text size
      color: isDark ? "#fff" : "#000",
      marginLeft: 8, // Spacing after icon
    },

    // Separator - Thin line between options in a card
    separator: {
      height: StyleSheet.hairlineWidth, // 1px on @1x, 0.5px on @2x, etc.
      backgroundColor: isDark ? "#38383a" : "#c6c6c8", // Subtle divider
      marginLeft: 52, // Indent to align with option text (after icon)
    },

    // Sign out button - Standalone button outside of a card
    signOutButton: {
      marginTop: 24,
      marginBottom: 40, // Extra bottom padding for scrolling
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },

    // Sign out button text - Red color indicates destructive action
    signOutText: {
      color: "#FF3B30", // iOS destructive red
      fontSize: 17,
      fontWeight: "600",
    },
  });
