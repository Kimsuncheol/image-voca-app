import React from "react";
import { StyleSheet, View } from "react-native";
import { Divider } from "./Divider";
import { FormInput } from "./FormInput";
import { GoogleButton } from "./GoogleButton";
import { PrimaryButton } from "./PrimaryButton";
import { RememberMeCheckbox } from "./RememberMeCheckbox";

interface LoginEmailStepProps {
  email: string;
  rememberMe: boolean;
  googleLoading: boolean;
  labels: {
    emailPlaceholder: string;
    rememberMe: string;
    next: string;
    or: string;
    googleSignIn: string;
    googleSigningIn: string;
  };
  onEmailChange: (value: string) => void;
  onEmailClear: () => void;
  onRememberMeToggle: () => void;
  onContinue: () => void;
  onGoogleLogin: () => void;
}

export const LoginEmailStep: React.FC<LoginEmailStepProps> = ({
  email,
  rememberMe,
  googleLoading,
  labels,
  onEmailChange,
  onEmailClear,
  onRememberMeToggle,
  onContinue,
  onGoogleLogin,
}) => {
  return (
    <>
      <FormInput
        icon="mail-outline"
        placeholder={labels.emailPlaceholder}
        value={email}
        onChangeText={onEmailChange}
        clearable
        onClear={onEmailClear}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.rememberMeContainer}>
        <RememberMeCheckbox
          checked={rememberMe}
          onToggle={onRememberMeToggle}
          label={labels.rememberMe}
        />
      </View>

      <PrimaryButton title={labels.next} onPress={onContinue} />

      <Divider text={labels.or} />

      <GoogleButton
        title={labels.googleSignIn}
        onPress={onGoogleLogin}
        loading={googleLoading}
        loadingTitle={labels.googleSigningIn}
      />
    </>
  );
};

const styles = StyleSheet.create({
  rememberMeContainer: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
});
