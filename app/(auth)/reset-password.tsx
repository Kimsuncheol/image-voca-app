import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import PasswordResetFlow from "./components/PasswordResetFlow";
import { auth } from "../../src/services/firebase";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const currentEmail = auth.currentUser?.email ?? "";

  useEffect(() => {
    if (!currentEmail) {
      router.replace("/(auth)/login");
    }
  }, [currentEmail, router]);

  if (!currentEmail) {
    return null;
  }

  return (
    <PasswordResetFlow
      variant="reset"
      initialEmail={currentEmail}
      emailEditable={false}
      redirectAfterSuccess="/(auth)/login"
    />
  );
}
