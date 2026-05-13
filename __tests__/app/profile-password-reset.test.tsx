import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

import ProfileScreen from "../../app/profile";

const mockPush = jest.fn();
const mockSendCurrentUserPasswordResetEmail = jest.fn();
const mockFetchSubscription = jest.fn();

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  }),
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  updateProfile: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

jest.mock("../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: true }),
}));

jest.mock("../../src/services/firebase", () => ({
  auth: {
    currentUser: {
      uid: "user-1",
      email: "current@example.com",
      displayName: "Current User",
      photoURL: null,
    },
  },
  storage: {},
}));

jest.mock("../../src/services/passwordResetService", () => ({
  sendCurrentUserPasswordResetEmail: (...args: unknown[]) =>
    mockSendCurrentUserPasswordResetEmail(...args),
}));

jest.mock("../../src/stores", () => ({
  useSubscriptionStore: Object.assign(
    jest.fn((selector: (state: { role: string[] }) => unknown) =>
      selector({ role: ["user"] }),
    ),
    {
      getState: () => ({
        fetchSubscription: mockFetchSubscription,
      }),
    },
  ),
}));

jest.mock("../../src/utils/deviceCountry", () => ({
  getDeviceCountryDisplayName: () => "United States",
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "common.success": "Success",
        "common.error": "Error",
        "profile.title": "Profile",
        "profile.userFallback": "User",
        "profile.sections.accountInfo": "Account Info",
        "profile.sections.accountActions": "Account Actions",
        "profile.fields.name": "Name",
        "profile.fields.displayNamePlaceholder": "Display Name",
        "profile.fields.email": "Email",
        "profile.fields.country": "Country",
        "profile.fields.role": "Role",
        "profile.resetPassword.title": "Reset Password",
        "profile.resetPassword.sending": "Sending...",
        "profile.resetPassword.emailSent":
          "Password reset email sent to {{email}}.",
        "profile.resetPassword.emailMissing":
          "No email address is available for this account.",
        "profile.resetPassword.sendFailed":
          "Failed to send password reset email. Please try again.",
        "profile.delete.title": "Delete Account",
        "profile.delete.processing": "Processing...",
      };

      const value = translations[key] ?? key;
      if (!params) return value;
      return Object.entries(params).reduce(
        (message, [paramKey, paramValue]) =>
          message.replace(`{{${paramKey}}}`, paramValue),
        value,
      );
    },
  }),
}));

describe("ProfileScreen password reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    mockSendCurrentUserPasswordResetEmail.mockResolvedValue({
      ok: true,
      email: "current@example.com",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends a password reset email from the profile screen without navigating", async () => {
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText("Reset Password"));

    await waitFor(() => {
      expect(mockSendCurrentUserPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    expect(mockPush).not.toHaveBeenCalledWith("/(auth)/reset-password");
    expect(Alert.alert).toHaveBeenCalledWith(
      "Success",
      "Password reset email sent to current@example.com.",
    );
  });
});
