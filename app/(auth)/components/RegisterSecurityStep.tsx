import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getBorderColors } from "../../../constants/borderColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { PasswordHints } from "./PasswordHints";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { PrimaryButton } from "./PrimaryButton";

interface RegisterSecurityStepProps {
  password: string;
  confirmPassword: string;
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  passwordsMatch: boolean;
  canContinue: boolean;
  labels: {
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    back: string;
    next: string;
    hints: {
      length: string;
      number: string;
      special: string;
      match: string;
    };
  };
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const RegisterSecurityStep: React.FC<RegisterSecurityStepProps> = ({
  password,
  confirmPassword,
  hasMinLength,
  hasNumber,
  hasSpecial,
  passwordsMatch,
  canContinue,
  labels,
  onPasswordChange,
  onConfirmPasswordChange,
  onBack,
  onNext,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <>
      <PasswordInput
        placeholder={labels.passwordPlaceholder}
        value={password}
        onChangeText={onPasswordChange}
      />

      <PasswordStrengthMeter
        password={password}
        hasMinLength={hasMinLength}
        hasNumber={hasNumber}
        hasSpecial={hasSpecial}
      />

      <PasswordInput
        placeholder={labels.confirmPasswordPlaceholder}
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
      />

      <PasswordHints
        hasMinLength={hasMinLength}
        hasNumber={hasNumber}
        hasSpecial={hasSpecial}
        passwordsMatch={passwordsMatch}
        hints={labels.hints}
      />
      <View style={styles.stepActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>{labels.back}</Text>
        </TouchableOpacity>
        <View style={styles.primaryAction}>
          <PrimaryButton
            title={labels.next}
            onPress={onNext}
            disabled={!canContinue}
          />
        </View>
      </View>
    </>
  );
};

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const borderColors = getBorderColors(isDark);
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    stepActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: borderColors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 18,
      minHeight: 52,
      backgroundColor: bg.cardElevated,
    },
    secondaryButtonText: {
      color: fontColors.body,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.bold,
    },
    primaryAction: {
      flex: 1,
    },
  });
};
