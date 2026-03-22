import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import { sendEmailVerification, signOut } from "firebase/auth";
import React from "react";
import VerifyEmailScreen from "../../../app/(auth)/verify-email";

const mockReplace = jest.fn();
const mockRefreshAuthUser = jest.fn();
const mockSetAuthError = jest.fn();
const mockClearAuthError = jest.fn();
const mockUseAuth = jest.fn();

const translations: Record<string, string> = {
  "auth.errors.loginTitle": "Login Error",
  "auth.verifyEmail.title": "Verify Your Email",
  "auth.verifyEmail.subtitle":
    "Check your inbox and tap the verification link before using the app.",
  "auth.verifyEmail.emailLabel": "Signed in as",
  "auth.verifyEmail.emailMissing": "No email address found",
  "auth.verifyEmail.verifiedAction": "I verified my email",
  "auth.verifyEmail.checking": "Checking verification...",
  "auth.verifyEmail.resendAction": "Resend verification email",
  "auth.verifyEmail.resending": "Sending email...",
  "auth.verifyEmail.resendCooldown": "Resend in {{seconds}}s",
  "auth.verifyEmail.useAnotherAccount": "Use another account",
  "auth.verifyEmail.emailSent": "Verification email sent to {{email}}.",
  "auth.verifyEmail.sendFailed":
    "Failed to send verification email. Try again from this screen.",
  "auth.verifyEmail.stillPending":
    "This email is still unverified. Open the link in your inbox and try again.",
  "auth.verifyEmail.refreshFailed":
    "Failed to refresh verification status. Please try again.",
};

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  sendEmailVerification: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const value = translations[key] ?? key;
      if (!params) {
        return value;
      }

      return Object.entries(params).reduce(
        (result, [paramKey, paramValue]) =>
          result.replace(`{{${paramKey}}}`, String(paramValue)),
        value,
      );
    },
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("../../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../../../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../../src/services/firebase", () => ({
  auth: {
    currentUser: {
      emailVerified: false,
    },
  },
}));

describe("VerifyEmailScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);
    (signOut as jest.Mock).mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { email: "test@example.com" },
      authError: null,
      clearAuthError: mockClearAuthError,
      setAuthError: mockSetAuthError,
      refreshAuthUser: mockRefreshAuthUser,
    });
  });

  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
    });
    jest.useRealTimers();
  });

  it("renders the verification copy and signed-in email", () => {
    const screen = render(<VerifyEmailScreen />);

    expect(screen.getByText("Verify Your Email")).toBeTruthy();
    expect(screen.getByText("Signed in as")).toBeTruthy();
    expect(screen.getByText("test@example.com")).toBeTruthy();
  });

  it("resends verification email and starts the cooldown", async () => {
    const screen = render(<VerifyEmailScreen />);

    fireEvent.press(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(sendEmailVerification).toHaveBeenCalledWith(
        expect.objectContaining({ email: "test@example.com" }),
      );
    });

    expect(
      screen.getByText("Verification email sent to test@example.com."),
    ).toBeTruthy();
    expect(screen.getByText("Resend in 60s")).toBeTruthy();

    fireEvent.press(screen.getByText("Resend in 60s"));
    expect(sendEmailVerification).toHaveBeenCalledTimes(1);
  });

  it("checks the verification status when requested", async () => {
    const screen = render(<VerifyEmailScreen />);

    fireEvent.press(screen.getByText("I verified my email"));

    await waitFor(() => {
      expect(mockRefreshAuthUser).toHaveBeenCalledTimes(1);
    });
  });

  it("signs out and returns to login when using another account", async () => {
    const screen = render(<VerifyEmailScreen />);

    fireEvent.press(screen.getByText("Use another account"));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });
  });
});
