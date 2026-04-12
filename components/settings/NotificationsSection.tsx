import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface NotificationsSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  pushEnabled: boolean;
  notificationPermissionDenied: boolean;
  studyReminderEnabled: boolean;
  popWordEnabled: boolean;
  muteAtNightEnabled: boolean;
  onTogglePush: (value: boolean) => void;
  onToggleStudyReminder: (value: boolean) => void;
  onTogglePopWord: (value: boolean) => void;
  onToggleMuteAtNight: (value: boolean) => void;
  onOpenPermissionSettings: () => void;
  t: (key: string) => string;
}

export function NotificationsSection({
  styles,
  isDark,
  pushEnabled,
  notificationPermissionDenied,
  studyReminderEnabled,
  popWordEnabled,
  muteAtNightEnabled,
  onTogglePush,
  onToggleStudyReminder,
  onTogglePopWord,
  onToggleMuteAtNight,
  onOpenPermissionSettings,
  t,
}: NotificationsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("settings.notifications.title")}
      </Text>
      <View style={styles.card}>
        <View style={styles.option}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.notifications.push")}
            </Text>
          </View>
          <ToggleSwitch
            value={pushEnabled}
            onValueChange={onTogglePush}
            trackColor={{ false: "#767577", true: "#007AFF" }}
          />
        </View>
        {notificationPermissionDenied && (
          <TouchableOpacity onPress={onOpenPermissionSettings}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}>
              <Ionicons name="warning-outline" size={14} color="#FF9500" />
              <Text style={{ fontSize: 12, color: "#FF9500", flexShrink: 1 }}>
                {t("settings.notifications.permissionRequired")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.separator} />
        <View style={[styles.option, styles.subOption]}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="alarm-outline"
              size={22}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.notifications.studyReminder")}
            </Text>
          </View>
          <ToggleSwitch
            value={studyReminderEnabled}
            onValueChange={onToggleStudyReminder}
            trackColor={{ false: "#767577", true: "#007AFF" }}
          />
        </View>
        <View style={styles.separator} />
        <View style={[styles.option]}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="book-outline"
              size={22}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.notifications.wordOfTheDay")}
            </Text>
          </View>
          <ToggleSwitch
            value={popWordEnabled}
            onValueChange={onTogglePopWord}
            trackColor={{ false: "#767577", true: "#007AFF" }}
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.option}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="moon-outline"
              size={22}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.notifications.muteAtNight")}
            </Text>
          </View>
          <ToggleSwitch
            value={muteAtNightEnabled}
            onValueChange={onToggleMuteAtNight}
            trackColor={{ false: "#767577", true: "#007AFF" }}
          />
        </View>
      </View>
    </View>
  );
}
