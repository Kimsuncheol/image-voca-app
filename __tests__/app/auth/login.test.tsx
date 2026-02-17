import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React from "react";
import LoginScreen from "../../../app/(auth)/login";

const mockReplace = jest.fn();
const mockPromptAsync = jest.fn();

const translations: Record<string, string> = {
  "auth.errors.missingCredentials": "Please enter both email and password.",
  "auth.errors.loginTitle": "Login Error",
  "auth.errors.invalidEmail": "Please enter a valid email address",
  "auth.errors.invalidCredentials": "Invalid email or password.",
  "auth.errors.accountDisabled":
    "This account has been disabled. Please contact support.",
  "auth.errors.tooManyRequests": "Too many login attempts. Please try again later.",
  "auth.errors.networkError":
    "Network error. Please check your connection and try again.",
  "auth.errors.loginFailed": "Unable to sign in. Please try again.",
  "auth.login.title": "Welcome Back",
  "auth.login.subtitle": "Sign in to continue",
  "auth.login.emailPlaceholder": "Email",
  "auth.login.passwordPlaceholder": "Password",
  "auth.login.rememberMe": "Remember me",
  "auth.login.forgotPassword": "Forgot Password?",
  "auth.login.signingIn": "Signing In...",
  "auth.login.signIn": "Sign In",
  "auth.login.googleSigningIn": "Signing in...",
  "auth.login.googleSignIn": "Sign in with Google",
  "auth.login.noAccount": "Don't have an account? ",
  "auth.login.signUp": "Sign Up",
  "common.or": "or",
};

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
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

jest.mock("../../../src/hooks/useGoogleAuth", () => ({
  useGoogleAuth: () => ({
    promptAsync: mockPromptAsync,
    loading: false,
  }),
}));

jest.mock("../../../src/services/firebase", () => ({
  auth: {},
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it("shows missing credentials message when email or password is empty", () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Sign In"));

    expect(getByText("Please enter both email and password.")).toBeTruthy();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows invalid credentials message for auth/invalid-credential", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "invalid-password");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText("Invalid email or password.")).toBeTruthy();
    });
  });

  it("shows too many requests message for auth/too-many-requests", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/too-many-requests",
    });
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123!");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(
        getByText("Too many login attempts. Please try again later."),
      ).toBeTruthy();
    });
  });

  it("shows fallback message for unknown auth errors", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/something-unknown",
    });
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123!");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText("Unable to sign in. Please try again.")).toBeTruthy();
    });
  });

  it("navigates to tabs and keeps error banner hidden on successful login", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({});
    const { getByPlaceholderText, getByText, queryByText } = render(
      <LoginScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123!");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });

    expect(queryByText("Login Error")).toBeNull();
    expect(queryByText("Unable to sign in. Please try again.")).toBeNull();
  });
});
