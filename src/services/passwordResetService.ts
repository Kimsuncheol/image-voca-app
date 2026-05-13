import Constants from "expo-constants";
import {
  ActionCodeSettings,
  sendPasswordResetEmail,
  type Auth,
} from "firebase/auth";

import { auth } from "./firebase";

export const PASSWORD_RESET_ACTION_URL =
  "https://image-voca-app.web.app/reset-password";

type PasswordResetEmailFailureReason =
  | "missing-email"
  | "send-failed"
  | "unauthorized-continue-uri";

export type PasswordResetEmailResult =
  | { ok: true; email: string }
  | {
      ok: false;
      reason: PasswordResetEmailFailureReason;
      error?: unknown;
    };

const getFirebaseErrorCode = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const maybeCode = (error as { code?: unknown }).code;
    if (typeof maybeCode === "string") {
      return maybeCode;
    }
  }

  return undefined;
};

const isUnauthorizedContinueUriError = (error: unknown) => {
  const code = getFirebaseErrorCode(error);
  return (
    code === "auth/unauthorized-continue-uri" ||
    code === "auth/invalid-continue-uri" ||
    code === "auth/missing-continue-uri" ||
    code === "auth/argument-error"
  );
};

export const getPasswordResetActionUrl = () =>
  PASSWORD_RESET_ACTION_URL;

export const buildPasswordResetActionCodeSettings = (): ActionCodeSettings => {
  const iosBundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  const androidPackageName = Constants.expoConfig?.android?.package;

  return {
    url: getPasswordResetActionUrl(),
    handleCodeInApp: true,
    ...(iosBundleId ? { iOS: { bundleId: iosBundleId } } : {}),
    ...(androidPackageName
      ? {
          android: {
            packageName: androidPackageName,
            installApp: true,
          },
        }
      : {}),
  };
};

export const sendPasswordResetEmailForAddress = async (
  email: string,
  authInstance: Auth = auth,
): Promise<PasswordResetEmailResult> => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { ok: false, reason: "missing-email" };
  }

  try {
    await sendPasswordResetEmail(
      authInstance,
      trimmedEmail,
      buildPasswordResetActionCodeSettings(),
    );
    return { ok: true, email: trimmedEmail };
  } catch (error) {
    if (isUnauthorizedContinueUriError(error)) {
      return { ok: false, reason: "unauthorized-continue-uri", error };
    }

    return { ok: false, reason: "send-failed", error };
  }
};

export const sendCurrentUserPasswordResetEmail = async (
  authInstance: Auth = auth,
): Promise<PasswordResetEmailResult> => {
  const email = authInstance.currentUser?.email?.trim();
  if (!email) {
    return { ok: false, reason: "missing-email" };
  }

  return sendPasswordResetEmailForAddress(email, authInstance);
};
