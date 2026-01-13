import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ThemeType = "light" | "dark" | "system";

interface AppearanceSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  t: (key: string) => string;
}

export function AppearanceSection({
  styles,
  isDark,
  theme,
  setTheme,
  t,
}: AppearanceSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.appearance.title")}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => setTheme("light")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="sunny-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.appearance.light")}
            </Text>
          </View>
          {theme === "light" && (
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => setTheme("dark")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="moon-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.appearance.dark")}
            </Text>
          </View>
          {theme === "dark" && (
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => setTheme("system")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="settings-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.appearance.system")}
            </Text>
          </View>
          {theme === "system" && (
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
