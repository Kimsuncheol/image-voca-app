import React from "react";
import { PasswordResetFlow } from "./components/PasswordResetFlow";

export default function ResetPasswordScreen() {
  return (
    <PasswordResetFlow
      variant="reset"
      initialEmail=""
      emailEditable={false}
      redirectAfterSuccess="/(auth)/login"
    />
  );
}
