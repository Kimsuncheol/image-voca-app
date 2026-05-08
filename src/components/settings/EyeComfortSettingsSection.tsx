import { FontSizes } from "@/constants/fontSizes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ToggleSwitch } from "../../../components/common/ToggleSwitch";
import { useEyeComfort } from "../../hooks/useEyeComfort";

interface EyeComfortSettingsSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  t: (
    key: string,
    options?: {
      defaultValue?: string;
    },
  ) => string;
}

export function EyeComfortSettingsSection({
  styles,
  isDark,
  t,
}: EyeComfortSettingsSectionProps) {
  const router = useRouter();
  const { isEnabled, level, toggle } = useEyeComfort();

  const iconColor = isDark ? "#fff" : "#333";
  const descriptionColor = isDark ? "#a1a1aa" : "#6b7280";
  const chevronColor = isDark ? "#8e8e93" : "#c7c7cc";

  const currentLevelLabel = t(`settings.eyeComfort.levels.${level}`, {
    defaultValue: level.charAt(0).toUpperCase() + level.slice(1).toLowerCase(),
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("settings.eyeComfort.title", {
          defaultValue: "Eye Comfort",
        })}
      </Text>
      <View style={styles.card}>
        <View style={styles.option}>
          <View style={[styles.optionLeft, localStyles.summaryLeft]}>
            <Ionicons name="eye-outline" size={22} color={iconColor} />
            <View style={localStyles.textGroup}>
              <Text style={styles.optionText}>
                {t("settings.eyeComfort.toggleLabel", {
                  defaultValue: "Eye comfort mode",
                })}
              </Text>
              <Text
                testID="eye-comfort-description"
                style={[
                  localStyles.description,
                  { color: descriptionColor },
                ]}
              >
                {t("settings.eyeComfort.description", {
                  defaultValue:
                    "Adds a gentle warm tint to reduce blue light while studying.",
                })}
              </Text>
            </View>
          </View>
          <ToggleSwitch
            value={isEnabled}
            onValueChange={toggle}
            trackColor={{
              false: "#767577",
              true: isDark ? "#0a84ff" : "#007AFF",
            }}
          />
        </View>
        {isEnabled ? (
          <>
            <View style={styles.separator} />
            <TouchableOpacity
              testID="eye-comfort-intensity-row"
              style={styles.option}
              onPress={() => router.push("/settings/eye-comfort-intensity")}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="color-filter-outline"
                  size={22}
                  color={iconColor}
                />
                <Text style={styles.optionText}>
                  {t("settings.eyeComfort.intensity", {
                    defaultValue: "Intensity",
                  })}
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionValue}>{currentLevelLabel}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={chevronColor}
                />
              </View>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  summaryLeft: {
    alignItems: "flex-start",
  },
  textGroup: {
    flex: 1,
    marginRight: 20,
  },
  description: {
    fontSize: FontSizes.caption,
    lineHeight: 17,
    marginLeft: 8,
    marginTop: 4,
  },
});
