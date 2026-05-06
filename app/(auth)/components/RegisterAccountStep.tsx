import React from "react";
import { StyleSheet, Text } from "react-native";
import { FontSizes } from "@/constants/fontSizes";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { AvatarPicker } from "./AvatarPicker";
import { FormInput } from "./FormInput";
import { PrimaryButton } from "./PrimaryButton";

type EmailAvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

interface RegisterAccountStepProps {
  avatarUri: string | null;
  displayName: string;
  email: string;
  isValidEmail: boolean;
  emailTouched: boolean;
  emailAvailabilityStatus: EmailAvailabilityStatus;
  emailAvailabilityMessage: string;
  permissionError: string;
  canContinue: boolean;
  labels: {
    avatar: string;
    fullNamePlaceholder: string;
    emailPlaceholder: string;
    invalidEmail: string;
    next: string;
  };
  onPickImage: () => void;
  onDisplayNameChange: (value: string) => void;
  onDisplayNameClear: () => void;
  onEmailChange: (value: string) => void;
  onEmailClear: () => void;
  onEmailBlur: () => void;
  onNext: () => void;
}

export const RegisterAccountStep: React.FC<RegisterAccountStepProps> = ({
  avatarUri,
  displayName,
  email,
  isValidEmail,
  emailTouched,
  emailAvailabilityStatus,
  emailAvailabilityMessage,
  permissionError,
  canContinue,
  labels,
  onPickImage,
  onDisplayNameChange,
  onDisplayNameClear,
  onEmailChange,
  onEmailClear,
  onEmailBlur,
  onNext,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const emailAvailabilityMessageStyle = [
    styles.emailAvailabilityMessage,
    emailAvailabilityStatus === "available" && styles.emailAvailableMessage,
    (emailAvailabilityStatus === "taken" ||
      emailAvailabilityStatus === "error") &&
      styles.emailUnavailableMessage,
  ];

  return (
    <>
      <AvatarPicker
        avatarUri={avatarUri}
        onPress={onPickImage}
        label={labels.avatar}
        errorMessage={permissionError}
      />
      <FormInput
        icon="person-outline"
        placeholder={labels.fullNamePlaceholder}
        value={displayName}
        onChangeText={onDisplayNameChange}
        clearable
        onClear={onDisplayNameClear}
        autoCapitalize="words"
      />

      <FormInput
        icon="mail-outline"
        placeholder={labels.emailPlaceholder}
        value={email}
        onChangeText={onEmailChange}
        clearable
        onClear={onEmailClear}
        onBlur={onEmailBlur}
        autoCapitalize="none"
        keyboardType="email-address"
        showValidation={true}
        isValid={isValidEmail}
        isTouched={emailTouched}
        errorMessage={labels.invalidEmail}
      />
      {!!emailAvailabilityMessage && (
        <Text style={emailAvailabilityMessageStyle}>
          {emailAvailabilityMessage}
        </Text>
      )}
      <PrimaryButton
        title={labels.next}
        onPress={onNext}
        disabled={!canContinue}
      />
    </>
  );
};

const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    emailAvailabilityMessage: {
      color: fontColors.supporting,
      fontSize: FontSizes.caption,
      marginTop: -12,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    emailAvailableMessage: {
      color: fontColors.success,
    },
    emailUnavailableMessage: {
      color: fontColors.error,
    },
  });
};
