import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import React from "react";
import RegisterScreen from "../../../app/(auth)/register";
import { ensureUserProfileDocument } from "../../../src/services/userProfileService";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

const mockReplace = jest.fn();
const mockPromptAsync = jest.fn();
const mockSetAuthError = jest.fn();
const mockClearAuthError = jest.fn();

const translations: Record<string, string> = {
  "auth.errors.missingFields": "Please fill in all fields.",
  "auth.errors.passwordRequirements": "Please meet all password requirements.",
  "auth.errors.passwordMismatch": "Passwords do not match.",
  "auth.errors.registerTitle": "Registration Error",
  "auth.errors.emailAlreadyInUse":
    "An account with this email already exists. Please sign in instead.",
  "auth.errors.invalidEmail": "Please enter a valid email address",
  "auth.errors.permissionMessage":
    "Permission to access camera roll is required!",
  "auth.register.title": "Create Account",
  "auth.register.subtitle": "Sign up to get started",
  "auth.register.avatarLabel": "Add Profile Photo (Optional)",
  "auth.register.fullNamePlaceholder": "Full Name",
  "auth.register.emailPlaceholder": "Email",
  "auth.register.passwordPlaceholder": "Password",
  "auth.register.confirmPasswordPlaceholder": "Confirm Password",
  "auth.register.passwordHint.length": "At least 8 characters",
  "auth.register.passwordHint.number": "Contains a number",
  "auth.register.passwordHint.special": "Contains a special character",
  "auth.register.passwordHint.match": "Passwords match",
  "auth.register.creatingAccount": "Creating Account...",
  "auth.register.register": "Register",
  "auth.register.googleSignIn": "Sign in with Google",
  "auth.register.googleSigningIn": "Signing in...",
  "auth.register.hasAccount": "Already have an account? ",
  "auth.register.signIn": "Sign In",
  "auth.verifyEmail.sendFailed":
    "Failed to send verification email. Try again from this screen.",
  "common.or": "OR",
};

// ---------------------------------------------------------------------------
// Jest module mocks
// ---------------------------------------------------------------------------

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    granted: true,
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
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

jest.mock("../../../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: "en",
    setLearningLanguage: jest.fn(),
  }),
}));

jest.mock("../../../src/context/AuthContext", () => ({
  useAuth: () => ({
    setAuthError: mockSetAuthError,
    clearAuthError: mockClearAuthError,
  }),
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

jest.mock("../../../src/services/userProfileService", () => ({
  ensureUserProfileDocument: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A valid password satisfying all three rules */
const VALID_PASSWORD = "Password1!";

/**
 * Fill the registration form with the given values.
 * Leaves confirmPassword = password by default.
 */
function fillForm(
  utils: ReturnType<typeof render>,
  opts: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {},
) {
  const {
    name = "Test User",
    email = "test@example.com",
    password = VALID_PASSWORD,
    confirmPassword = VALID_PASSWORD,
  } = opts;

  fireEvent.changeText(utils.getByPlaceholderText("Full Name"), name);
  fireEvent.changeText(utils.getByPlaceholderText("Email"), email);

  // Trigger email blur so isValidEmail state is set
  fireEvent(utils.getByPlaceholderText("Email"), "blur");

  fireEvent.changeText(utils.getByPlaceholderText("Password"), password);
  fireEvent.changeText(
    utils.getByPlaceholderText("Confirm Password"),
    confirmPassword,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    // Default: Firebase succeeds
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: "uid-123", email: "test@example.com" },
    });
    (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);
    (updateProfile as jest.Mock).mockResolvedValue(undefined);
    (ensureUserProfileDocument as jest.Mock).mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Client-side validation
  // -------------------------------------------------------------------------

  it("shows missing-fields error when form is empty", () => {
    const utils = render(<RegisterScreen />);
    fireEvent.press(utils.getByText("Register"));
    expect(utils.getByText("Please fill in all fields.")).toBeTruthy();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows password requirements error when password is too weak", () => {
    const utils = render(<RegisterScreen />);
    fillForm(utils, { password: "short", confirmPassword: "short" });
    fireEvent.press(utils.getByText("Register"));
    expect(
      utils.getByText("Please meet all password requirements."),
    ).toBeTruthy();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows password mismatch error when passwords do not match", () => {
    const utils = render(<RegisterScreen />);
    fillForm(utils, { confirmPassword: "DifferentPass1!" });
    fireEvent.press(utils.getByText("Register"));
    expect(utils.getByText("Passwords do not match.")).toBeTruthy();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Firebase error handling
  // -------------------------------------------------------------------------

  it("shows friendly message for auth/email-already-in-use", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/email-already-in-use",
    });

    const utils = render(<RegisterScreen />);
    fillForm(utils);
    fireEvent.press(utils.getByText("Register"));

    await waitFor(() => {
      expect(
        utils.getByText(
          "An account with this email already exists. Please sign in instead.",
        ),
      ).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows invalid email message for auth/invalid-email", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-email",
    });

    const utils = render(<RegisterScreen />);
    fillForm(utils);
    fireEvent.press(utils.getByText("Register"));

    await waitFor(() => {
      expect(
        utils.getByText("Please enter a valid email address"),
      ).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows password requirements message for auth/weak-password", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/weak-password",
    });

    const utils = render(<RegisterScreen />);
    fillForm(utils);
    fireEvent.press(utils.getByText("Register"));

    await waitFor(() => {
      expect(
        utils.getByText("Please meet all password requirements."),
      ).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows generic registration error for unknown Firebase errors", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/something-unexpected",
    });

    const utils = render(<RegisterScreen />);
    fillForm(utils);
    fireEvent.press(utils.getByText("Register"));

    await waitFor(() => {
      expect(utils.getByText("Registration Error")).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it("sends verification email and navigates to verify-email on successful registration", async () => {
    const utils = render(<RegisterScreen />);
    fillForm(utils);
    fireEvent.press(utils.getByText("Register"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/verify-email");
    });

    expect(ensureUserProfileDocument).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "uid-123" }),
      expect.objectContaining({
        displayName: "Test User",
        email: "test@example.com",
        photoURL: null,
      }),
    );
    expect(sendEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "uid-123" }),
    );
    expect(mockSetAuthError).not.toHaveBeenCalled();

    expect(utils.queryByText("Registration Error")).toBeNull();
    expect(
      utils.queryByText(
        "An account with this email already exists. Please sign in instead.",
      ),
    ).toBeNull();
  });

  it("routes to verify-email and stores an auth error when sending verification fails", async () => {
    (sendEmailVerification as jest.Mock).mockRejectedValueOnce(
      new Error("smtp unavailable"),
    );

    const utils = render(<RegisterScreen />);
    fillForm(utils);
    fireEvent.press(utils.getByText("Register"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/verify-email");
    });

    expect(mockSetAuthError).toHaveBeenCalledWith(
      "Failed to send verification email. Try again from this screen.",
    );
  });
});
