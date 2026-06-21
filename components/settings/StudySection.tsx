import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Platform, Text, View } from "react-native";
import {
  getLockScreenStudyPreferences,
  setLockScreenStudyEnabled,
  subscribeLockScreenStudyPreferences,
} from "../../src/services/lockScreenStudyPreferences";
import {
  cancelLockScreenVocabularyNotifications,
  configureNotifications,
  isPermissionGranted,
} from "../../src/utils/notifications";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface StudySectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  t: (key: string, options?: any) => string;
}

export function StudySection({ styles, isDark, t }: StudySectionProps) {
  const [studyOnLockScreenEnabled, setStudyOnLockScreenEnabledState] =
    useState(false);

  useEffect(() => {
    let isActive = true;

    void getLockScreenStudyPreferences()
      .then((preferences) => {
        if (isActive) {
          setStudyOnLockScreenEnabledState(
            preferences.studyOnLockScreenEnabled,
          );
        }
      })
      .catch((error) => {
        console.warn("Failed to load lock screen study preferences", error);
      });

    const unsubscribe = subscribeLockScreenStudyPreferences((preferences) => {
      setStudyOnLockScreenEnabledState(preferences.studyOnLockScreenEnabled);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setStudyOnLockScreenEnabledState(enabled);

    if (enabled && Platform.OS === "android") {
      const permissions = await configureNotifications();

      if (!permissions) {
        setStudyOnLockScreenEnabledState(false);
        await setLockScreenStudyEnabled(false);
        Alert.alert(
          t("common.error"),
          t("settings.notifications.moduleMissing"),
        );
        return;
      }

      if (!isPermissionGranted(permissions)) {
        setStudyOnLockScreenEnabledState(false);
        await setLockScreenStudyEnabled(false);
        Alert.alert(
          t("settings.notifications.permissionTitle"),
          t("settings.notifications.permissionMessage"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("settings.notifications.openSettings"),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }
    }

    const result = await setLockScreenStudyEnabled(enabled);

    if (!enabled) {
      try {
        await cancelLockScreenVocabularyNotifications();
      } catch (error) {
        console.warn(
          "Failed to cancel lock screen vocabulary notifications",
          error,
        );
      }
    }

    if (!result.persistedLocally) {
      Alert.alert(t("common.error"), t("settings.study.saveFailed"));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.study.title")}</Text>
      <View style={styles.card}>
        <View style={styles.option}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="phone-portrait-outline"
              size={22}
              color={isDark ? "#fff" : "#333"}
            />
            <View style={styles.optionTextGroup}>
              <Text style={styles.optionText} numberOfLines={2}>
                {t("settings.study.lockScreenStudy")}
              </Text>
            </View>
          </View>
          <ToggleSwitch
            testID="settings-lock-screen-study-toggle"
            value={studyOnLockScreenEnabled}
            onValueChange={(enabled) => {
              void handleToggle(enabled);
            }}
            trackColor={{
              false: "#767577",
              true: isDark ? "#0a84ff" : "#007AFF",
            }}
          />
        </View>
      </View>
    </View>
  );
}
