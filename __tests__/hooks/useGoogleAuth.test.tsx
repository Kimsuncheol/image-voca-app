import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { ensureUserProfileDocument } from "../../src/services/userProfileService";

const mockPromptAsync = jest.fn();
const mockUseIdTokenAuthRequest = jest.fn();

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "imagevocaapp://auth"),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useIdTokenAuthRequest: (...args: unknown[]) => mockUseIdTokenAuthRequest(...args),
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: {
    credential: jest.fn(() => "google-credential"),
  },
  signInWithCredential: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  auth: {},
}));

jest.mock("../../src/services/userProfileService", () => ({
  ensureUserProfileDocument: jest.fn(),
}));

function TestComponent() {
  useGoogleAuth();
  return null;
}

describe("useGoogleAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIdTokenAuthRequest.mockReturnValue([
      null,
      {
        type: "success",
        params: {
          id_token: "id-token",
        },
      },
      mockPromptAsync,
    ]);
    (signInWithCredential as jest.Mock).mockResolvedValue({
      user: {
        uid: "google-user",
        email: "google@example.com",
        providerData: [{ providerId: "google.com" }],
      },
    });
    (ensureUserProfileDocument as jest.Mock).mockResolvedValue(undefined);
  });

  it("ensures the shared Firestore user profile after successful Google sign-in", async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith("id-token");
      expect(signInWithCredential).toHaveBeenCalledWith({}, "google-credential");
      expect(ensureUserProfileDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "google-user",
        }),
      );
    });
  });
});
