import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import PasswordResetFlow from "../../../app/(auth)/components/PasswordResetFlow";

const mockReplace = jest.fn();
const mockRouter = {
  replace: mockReplace,
};
const mockSendPasswordResetEmailForAddress = jest.fn();
const mockVerifyPasswordResetCode = jest.fn();
const mockConfirmPasswordReset = jest.fn();

let mockSearchParams: Record<string, string | undefined> = {};

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
  "auth.passwordReset.sendEmail": "Send Password Reset Email",
  "auth.passwordReset.sendingEmail": "Sending email...",
  "auth.passwordReset.resendEmail": "Resend Email",
  "auth.passwordReset.checkInbox":
    "Open the password reset email link to continue.",
  "auth.passwordReset.verifyingCode": "Verifying password reset link...",
  "auth.passwordReset.verifyFailed":
    "This password reset link is invalid or expired. Request a new email.",
  "auth.passwordReset.invalidLinkToast":
    "This password reset link is invalid or expired. Please request a new one.",
  "auth.passwordReset.sendFailed":
    "Failed to send password reset email. Please try again.",
  "auth.passwordReset.emailRequired": "Please enter your email address.",
  "auth.passwordReset.emailInvalid": "Please enter a valid email address.",
  "auth.passwordReset.emailSent": "Password reset email sent to {{email}}.",
  "auth.passwordReset.passwordPlaceholder": "New Password",
  "auth.passwordReset.confirmPasswordPlaceholder": "Confirm New Password",
  "auth.passwordReset.submit": "Reset Password",
  "auth.passwordReset.submitting": "Resetting password...",
  "auth.passwordReset.resetSuccess":
    "Password reset successful. Please sign in again.",
  "auth.passwordReset.resetFailed": "Failed to reset password. Please try again.",
  "auth.passwordReset.passwordHint.length": "At least 6 characters",
  "auth.passwordReset.passwordHint.number": "Contains a number",
  "auth.passwordReset.passwordHint.special": "Contains a special character",
  "auth.passwordReset.passwordHint.match": "Passwords match",
  "auth.passwordReset.minLengthValidation":
    "Password must be at least 6 characters.",
  "auth.passwordReset.mismatchValidation": "Passwords must match.",
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
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock("expo-linking", () => ({
  useURL: () => null,
  parse: jest.fn(() => ({ queryParams: {} })),
}));

jest.mock("firebase/auth", () => ({
  verifyPasswordResetCode: (...args: unknown[]) =>
    mockVerifyPasswordResetCode(...args),
  confirmPasswordReset: (...args: unknown[]) => mockConfirmPasswordReset(...args),
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

jest.mock("../../../src/services/passwordResetService", () => ({
  sendPasswordResetEmailForAddress: (...args: unknown[]) =>
    mockSendPasswordResetEmailForAddress(...args),
}));

describe("PasswordResetFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    mockVerifyPasswordResetCode.mockResolvedValue("verified@example.com");
    mockSendPasswordResetEmailForAddress.mockResolvedValue({
      ok: true,
      email: "test@example.com",
    });
  });

  it("shows password reset email step initially", () => {
    const { getByPlaceholderText, getByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByText("Send Password Reset Email")).toBeTruthy();
  });

  it("sends password reset email and shows success message", async () => {
    const { getByPlaceholderText, getByText } = render(
      <PasswordResetFlow
        variant="forgot"
        initialEmail=""
        emailEditable={true}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.press(getByText("Send Password Reset Email"));

    await waitFor(() => {
      expect(mockSendPasswordResetEmailForAddress).toHaveBeenCalledWith(
        "test@example.com",
      );
    });

    expect(getByText("Password reset email sent to test@example.com.")).toBeTruthy();
  });

  it("verifies oobCode and shows reset password form", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };

    const { getByPlaceholderText, queryByText } = render(
      <PasswordResetFlow
        variant="reset"
        initialEmail=""
        emailEditable={false}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(queryByText("Verifying password reset link...")).toBeNull();
    });

    expect(getByPlaceholderText("New Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm New Password")).toBeTruthy();
  });

  it("blocks reset when passwords do not match", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };

    const { getByPlaceholderText, getByText, queryByText } = render(
      <PasswordResetFlow
        variant="reset"
        initialEmail=""
        emailEditable={false}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(queryByText("Verifying password reset link...")).toBeNull();
    });

    fireEvent.changeText(getByPlaceholderText("New Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm New Password"),
      "Password2!",
    );
    fireEvent.press(getByText("Reset Password"));

    expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    expect(getByText("Passwords must match.")).toBeTruthy();
  });

  it("dismisses password reset errors from the toast", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };
    mockConfirmPasswordReset.mockRejectedValueOnce(new Error("reset failed"));

    const { getByLabelText, getByPlaceholderText, getByText, queryByText } =
      render(
        <PasswordResetFlow
          variant="reset"
          initialEmail=""
          emailEditable={false}
          redirectAfterSuccess="/(auth)/login"
        />,
      );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(queryByText("Verifying password reset link...")).toBeNull();
    });

    fireEvent.changeText(getByPlaceholderText("New Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm New Password"),
      "Password1!",
    );
    fireEvent.press(getByText("Reset Password"));

    await waitFor(() => {
      expect(getByText("Failed to reset password. Please try again.")).toBeTruthy();
    });

    fireEvent.press(getByLabelText("Close"));

    await waitFor(() => {
      expect(queryByText("Failed to reset password. Please try again.")).toBeNull();
    });
  });

  it("blocks reset when password constraints are not met", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };

    const { getByPlaceholderText, getByText, queryByText } = render(
      <PasswordResetFlow
        variant="reset"
        initialEmail=""
        emailEditable={false}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(queryByText("Verifying password reset link...")).toBeNull();
    });

    fireEvent.changeText(getByPlaceholderText("New Password"), "abc");
    fireEvent.changeText(getByPlaceholderText("Confirm New Password"), "abc");
    fireEvent.press(getByText("Reset Password"));

    expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText("Password must be at least 6 characters.")).toBeTruthy();
    });
  });

  it("resets password successfully and redirects", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "test-code" };
    mockConfirmPasswordReset.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <PasswordResetFlow
        variant="reset"
        initialEmail=""
        emailEditable={false}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(mockVerifyPasswordResetCode).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(queryByText("Verifying password reset link...")).toBeNull();
    });

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

    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
      },
      { timeout: 2500 },
    );
  });

  it("shows error when verification code is invalid", async () => {
    mockSearchParams = { mode: "resetPassword", oobCode: "invalid-code" };
    mockVerifyPasswordResetCode.mockRejectedValue(new Error("invalid code"));

    const { getByText } = render(
      <PasswordResetFlow
        variant="reset"
        initialEmail=""
        emailEditable={false}
        redirectAfterSuccess="/(auth)/login"
      />,
    );

    await waitFor(() => {
      expect(
        getByText(
          "This password reset link is invalid or expired. Please request a new one.",
        ),
      ).toBeTruthy();
    });
  });
});
