import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getBorderColors } from "../../../constants/borderColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { LinkButton } from "./LinkButton";
import { PasswordInput } from "./PasswordInput";
import { PrimaryButton } from "./PrimaryButton";

interface LoginPasswordStepProps {
  password: string;
  loading: boolean;
  labels: {
    passwordPlaceholder: string;
    forgotPassword: string;
    back: string;
    signIn: string;
    signingIn: string;
  };
  onPasswordChange: (value: string) => void;
  onForgotPassword: () => void;
  onBack: () => void;
  onSignIn: () => void;
}

export const LoginPasswordStep: React.FC<LoginPasswordStepProps> = ({
  password,
  loading,
  labels,
  onPasswordChange,
  onForgotPassword,
  onBack,
  onSignIn,
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
      <View style={styles.forgotPasswordContainer}>
        <LinkButton text={labels.forgotPassword} onPress={onForgotPassword} />
      </View>
      <View style={styles.stepActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onBack}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>{labels.back}</Text>
        </TouchableOpacity>
        <View style={styles.primaryAction}>
          <PrimaryButton
            title={labels.signIn}
            onPress={onSignIn}
            loading={loading}
            loadingTitle={labels.signingIn}
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
    forgotPasswordContainer: {
      alignItems: "flex-end",
      marginBottom: 16,
    },
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
