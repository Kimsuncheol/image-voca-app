import React from "react";
import PasswordResetFlow from "./components/PasswordResetFlow";

export default function ForgotPasswordScreen() {
  return (
    <PasswordResetFlow
      variant="forgot"
      initialEmail=""
      emailEditable={true}
      redirectAfterSuccess="/(auth)/login"
    />
  );
}
