import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { FontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { FontSizes } from "@/constants/fontSizes";

interface PasswordStrengthMeterProps {
  password: string;
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

type StrengthLevel = "empty" | "weak" | "fair" | "strong";

const STRENGTH_CONFIG: Record<
  Exclude<StrengthLevel, "empty">,
  { label: string; color: string; icon: "close-circle" | "alert-circle" | "checkmark-circle" }
> = {
  weak: {
    label: "Weak",
    color: FontColors.light.dangerAction,
    icon: "close-circle",
  },
  fair: {
    label: "Fair",
    color: FontColors.light.passwordStrengthFair,
    icon: "alert-circle",
  },
  strong: {
    label: "Strong",
    color: FontColors.light.quizCorrect,
    icon: "checkmark-circle",
  },
};

function getStrength(
  password: string,
  hasMinLength: boolean,
  hasNumber: boolean,
  hasSpecial: boolean,
): StrengthLevel {
  if (!password) return "empty";
  const score = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  return "strong";
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  hasMinLength,
  hasNumber,
  hasSpecial,
}) => {
  const { isDark } = useTheme();
  const strength = getStrength(password, hasMinLength, hasNumber, hasSpecial);

  if (strength === "empty") return null;

  const config = STRENGTH_CONFIG[strength];
  const filledSegments = strength === "weak" ? 1 : strength === "fair" ? 2 : 3;

  return (
    <View style={styles.container}>
      {/* Segmented bar */}
      <View style={styles.barRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                backgroundColor:
                  i < filledSegments
                    ? config.color
                    : getBackgroundColors(isDark).subtleGray,
              },
            ]}
          />
        ))}
      </View>

      {/* Label */}
      <View style={styles.labelRow}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  barRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: FontSizes.caption,
    fontWeight: "600",
  },
});
