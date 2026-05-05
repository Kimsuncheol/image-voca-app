import React from "react";
import { AvatarPicker } from "./AvatarPicker";
import { FormInput } from "./FormInput";
import { PrimaryButton } from "./PrimaryButton";

interface RegisterAccountStepProps {
  avatarUri: string | null;
  displayName: string;
  email: string;
  isValidEmail: boolean;
  emailTouched: boolean;
  permissionError: string;
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
  permissionError,
  labels,
  onPickImage,
  onDisplayNameChange,
  onDisplayNameClear,
  onEmailChange,
  onEmailClear,
  onEmailBlur,
  onNext,
}) => {
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
      <PrimaryButton title={labels.next} onPress={onNext} />
    </>
  );
};
