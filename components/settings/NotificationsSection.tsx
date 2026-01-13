import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface NotificationsSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  pushEnabled: boolean;
  studyReminderEnabled: boolean;
  popWordEnabled: boolean;
  onTogglePush: (value: boolean) => void;
  onToggleStudyReminder: (value: boolean) => void;
  onTogglePopWord: (value: boolean) => void;
  t: (key: string) => string;
}

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trackColor?: { false: string; true: string };
}

const TOGGLE_WIDTH = 50;
const TOGGLE_HEIGHT = 30;
const TOGGLE_PADDING = 2;
const TOGGLE_THUMB = TOGGLE_HEIGHT - TOGGLE_PADDING * 2;

function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  trackColor = { false: "#767577", true: "#34C759" },
}: ToggleSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedStyle = useMemo(
    () => ({
      transform: [
        {
          translateX: translateX.interpolate({
            inputRange: [0, 1],
            outputRange: [
              TOGGLE_PADDING,
              TOGGLE_WIDTH - TOGGLE_THUMB - TOGGLE_PADDING,
            ],
          }),
        },
      ],
    }),
    [translateX]
  );

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateX, value]);

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      style={[
        toggleStyles.track,
        { backgroundColor: value ? trackColor.true : trackColor.false },
        disabled && toggleStyles.disabled,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View style={[toggleStyles.thumb, animatedStyle]} />
    </Pressable>
  );
}

export function NotificationsSection({
  styles,
  isDark,
  pushEnabled,
  studyReminderEnabled,
  popWordEnabled,
  onTogglePush,
  onToggleStudyReminder,
  onTogglePopWord,
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
            trackColor={{ false: "#767577", true: "#34C759" }}
          />
        </View>
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
            trackColor={{ false: "#767577", true: "#34C759" }}
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
            trackColor={{ false: "#767577", true: "#34C759" }}
          />
        </View>
      </View>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  track: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    justifyContent: "center",
  },
  thumb: {
    width: TOGGLE_THUMB,
    height: TOGGLE_THUMB,
    borderRadius: TOGGLE_THUMB / 2,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
