import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Switch, Text, View } from "react-native";

interface NotificationsSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  pushEnabled: boolean;
  onTogglePush: (value: boolean) => void;
  t: (key: string) => string;
}

export function NotificationsSection({
  styles,
  isDark,
  pushEnabled,
  onTogglePush,
  t,
}: NotificationsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.notifications.title")}</Text>
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
          <Switch
            value={pushEnabled}
            onValueChange={onTogglePush}
            trackColor={{ false: "#767577", true: "#34C759" }}
          />
        </View>
      </View>
    </View>
  );
}
