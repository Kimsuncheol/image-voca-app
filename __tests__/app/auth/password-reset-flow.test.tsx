import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import PasswordResetFlow from "../../../app/(auth)/components/PasswordResetFlow";

const mockReplace = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockVerifyPasswordResetCode = jest.fn();
const mockConfirmPasswordReset = jest.fn();
const mockSignOut = jest.fn();

let mockSearchParams: Record<string, string | undefined> = {};

const flushMicrotasks = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

const translations: Record<string, string> = {
  "auth.errors.passwordRequirements": "Please meet all password requirements.",
  "auth.errors.passwordMismatch": "Passwords do not match.",
  "auth.passwordReset.forgotTitle": "Forgot Password",
  "auth.passwordReset.forgotSubtitle": "Verify your email to reset your password.",
  "auth.passwordReset.resetTitle": "Reset Password",
  "auth.passwordReset.resetSubtitle": "Verify your email, then set a new password.",
  "auth.passwordReset.newPasswordTitle": "Set New Password",
  "auth.passwordReset.newPasswordSubtitle":
    "Create a new password for your account.",
  "auth.passwordReset.emailPlaceholder": "Email",
  "auth.passwordReset.sendEmail": "Send Verification Email",
  "auth.passwordReset.sendingEmail": "Sending email...",
  "auth.passwordReset.resendEmail": "Resend Email",
  "auth.passwordReset.checkInbox": "Open the verification email link to continue.",
  "auth.passwordReset.verifyingCode": "Verifying email link...",
  "auth.passwordReset.verifyFailed":
    "This verification link is invalid or expired. Request a new email.",
  "auth.passwordReset.sendFailed":
    "Failed to send verification email. Please try again.",
  "auth.passwordReset.emailRequired": "Please enter your email address.",
  "auth.passwordReset.emailInvalid": "Please enter a valid email address.",
  "auth.passwordReset.emailSent": "Verification email sent to {{email}}.",
  "auth.passwordReset.passwordPlaceholder": "New Password",
  "auth.passwordReset.confirmPasswordPlaceholder": "Confirm New Password",
  "auth.passwordReset.submit": "Reset Password",
  "auth.passwordReset.submitting": "Resetting password...",
  "auth.passwordReset.resetSuccess":
    "Password reset successful. Please sign in again.",
  "auth.passwordReset.resetFailed": "Failed to reset password. Please try again.",
  "auth.passwordReset.passwordHint.length": "At least 8 characters",
  "auth.passwordReset.passwordHint.number": "Contains a number",
  "auth.passwordReset.passwordHint.special": "Contains a special character",
  "auth.passwordReset.passwordHint.match": "Passwords match",
};

const translate = (key: string, params?: Record<string, string>) => {
  const value = translations[key] ?? key;
  if (!params) return value;

  return Object.entries(params).reduce(
    (acc, [paramKey, paramValue]) =>
      acc.replace(`{{${paramKey}}}`, String(paramValue)),
    value,
  );
};

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock("expo-linking", () => ({
  createURL: (path: string) => `imagevocaapp://${path.replace(/^\//, "")}`,
}));

jest.mock("expo-constants", () => ({
  expoConfig: {
    ios: { bundleIdentifier: "com.test.imagevocaapp" },
    android: { package: "com.test.imagevocaapp" },
  },
}));

jest.mock("firebase/auth", () => ({
  sendPasswordResetEmail: (...args: unknown[]) =>
    mockSendPasswordResetEmail(...args),
  verifyPasswordResetCode: (...args: unknown[]) =>
    mockVerifyPasswordResetCode(...args),
  confirmPasswordReset: (...args: unknown[]) => mockConfirmPasswordReset(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate,
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("../../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../../../src/services/firebase", () => ({
  auth: { currentUser: { email: "current@example.com" } },
}));

describe("PasswordResetFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    mockVerifyPasswordResetCode.mockResolvedValue("verified@example.com");
  });

  it("shows email verification step initially", () => {
    const { getByPlaceholderText, getByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByText("Send Verification Email")).toBeTruthy();
  });

  it("sends verification email and shows success message", async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.press(getByText("Send Verification Email"));

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(Object),
        "test@example.com",
        expect.objectContaining({
          url: "imagevocaapp://forgot-password",
          handleCodeInApp: true,
        }),
      );
    });

    expect(getByText("Verification email sent to test@example.com.")).toBeTruthy();
  });

  it("retries email send without action code settings when continue URI is rejected", async () => {
    mockSendPasswordResetEmail
      .mockRejectedValueOnce({ code: "auth/invalid-continue-uri" })
      .mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.press(getByText("Send Verification Email"));

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(2);
    });

    expect(mockSendPasswordResetEmail).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      "test@example.com",
      expect.objectContaining({
        url: "imagevocaapp://forgot-password",
        handleCodeInApp: true,
      }),
    );
    expect(mockSendPasswordResetEmail).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      "test@example.com",
    );
    expect(getByText("Verification email sent to test@example.com.")).toBeTruthy();
  });

  it("verifies oobCode and shows reset password form", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };

    const { getByPlaceholderText, queryByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await flushMicrotasks();
    await flushMicrotasks();
    expect(queryByText("Verifying email link...")).toBeNull();

    expect(getByPlaceholderText("New Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm New Password")).toBeTruthy();
  });

  it("blocks reset when passwords do not match", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };

    const { getByPlaceholderText, getByText, queryByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await flushMicrotasks();
    await flushMicrotasks();
    expect(queryByText("Verifying email link...")).toBeNull();

    fireEvent.changeText(getByPlaceholderText("New Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm New Password"),
      "Password2!",
    );
    fireEvent.press(getByText("Reset Password"));

    expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText("Passwords do not match.")).toBeTruthy();
    });
  });

  it("blocks reset when password constraints are not met", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };

    const { getByPlaceholderText, getByText, queryByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await flushMicrotasks();
    await flushMicrotasks();
    expect(queryByText("Verifying email link...")).toBeNull();

    fireEvent.changeText(getByPlaceholderText("New Password"), "abc");
    fireEvent.changeText(getByPlaceholderText("Confirm New Password"), "abc");
    fireEvent.press(getByText("Reset Password"));

    expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText("Please meet all password requirements.")).toBeTruthy();
    });
  });

  it("resets password successfully, signs out, and redirects", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };
    mockConfirmPasswordReset.mockResolvedValueOnce(undefined);
    mockSignOut.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await flushMicrotasks();
    await flushMicrotasks();
    expect(queryByText("Verifying email link...")).toBeNull();

    fireEvent.changeText(getByPlaceholderText("New Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm New Password"),
      "Password1!",
    );
    fireEvent.press(getByText("Reset Password"));

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        expect.any(Object),
        "test-code",
        "Password1!",
      );
    });

    expect(mockSignOut).toHaveBeenCalledWith(expect.any(Object));
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("shows error when verification code is invalid", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "invalid-code" };
    mockVerifyPasswordResetCode.mockRejectedValue(new Error("invalid code"));

    const { getByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(
        getByText(
          "This verification link is invalid or expired. Request a new email.",
        ),
      ).toBeTruthy();
    });

    expect(getByText("Send Verification Email")).toBeTruthy();
  });
});
