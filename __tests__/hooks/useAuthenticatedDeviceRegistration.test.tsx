import { render, waitFor } from "@testing-library/react-native";
import { signOut } from "firebase/auth";
import React from "react";
import { useAuthenticatedDeviceRegistration } from "../../src/hooks/useAuthenticatedDeviceRegistration";
import { ensureUserProfileDocument } from "../../src/services/userProfileService";
import {
  DeviceRegistrationLimitError,
  upsertCurrentDeviceRegistration,
} from "../../src/services/deviceRegistrationService";

const mockUseAuth = jest.fn();
const mockSetAuthError = jest.fn();

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../src/services/userProfileService", () => ({
  ensureUserProfileDocument: jest.fn(),
}));

jest.mock("../../src/services/deviceRegistrationService", () => ({
  DeviceRegistrationLimitError: class DeviceRegistrationLimitError extends Error {
    code = "device/limit-exceeded";
  },
  upsertCurrentDeviceRegistration: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  auth: {},
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "auth.errors.deviceLimitReached"
        ? "Device limit reached."
        : key,
  }),
}));

function TestComponent() {
  useAuthenticatedDeviceRegistration();
  return null;
}

describe("useAuthenticatedDeviceRegistration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ensureUserProfileDocument as jest.Mock).mockResolvedValue(undefined);
    (upsertCurrentDeviceRegistration as jest.Mock).mockResolvedValue(undefined);
    (signOut as jest.Mock).mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1", providerData: [], email: "test@example.com" },
      authStatus: "signed_in",
      setAuthError: mockSetAuthError,
    });
  });

  it("syncs the user profile and device once when a user session becomes available", async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(ensureUserProfileDocument).toHaveBeenCalledWith(
        expect.objectContaining({ uid: "user-1" }),
      );
      expect(upsertCurrentDeviceRegistration).toHaveBeenCalledWith(
        expect.objectContaining({ uid: "user-1" }),
      );
    });
  });

  it("does not sync twice for the same authenticated session", async () => {
    const view = render(<TestComponent />);

    await waitFor(() => {
      expect(upsertCurrentDeviceRegistration).toHaveBeenCalledTimes(1);
    });

    view.rerender(<TestComponent />);

    await waitFor(() => {
      expect(upsertCurrentDeviceRegistration).toHaveBeenCalledTimes(1);
    });
  });

  it("starts a new sync when a different user signs in", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1", providerData: [], email: "one@example.com" },
      authStatus: "signed_in",
      setAuthError: mockSetAuthError,
    });

    const view = render(<TestComponent />);

    await waitFor(() => {
      expect(upsertCurrentDeviceRegistration).toHaveBeenCalledTimes(1);
    });

    mockUseAuth.mockReturnValue({
      user: { uid: "user-2", providerData: [], email: "two@example.com" },
      authStatus: "signed_in",
      setAuthError: mockSetAuthError,
    });
    view.rerender(<TestComponent />);

    await waitFor(() => {
      expect(upsertCurrentDeviceRegistration).toHaveBeenCalledTimes(2);
    });
  });

  it("sets an auth error and signs out when the device cap is exceeded", async () => {
    (upsertCurrentDeviceRegistration as jest.Mock).mockRejectedValue(
      new DeviceRegistrationLimitError(),
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(mockSetAuthError).toHaveBeenCalledWith("Device limit reached.");
      expect(signOut).toHaveBeenCalledWith({});
    });
  });

  it("warns without signing out for non-limit registration failures", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    (upsertCurrentDeviceRegistration as jest.Mock).mockRejectedValue(
      new Error("unexpected failure"),
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(signOut).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to register authenticated device",
        expect.any(Error),
      );
    });

    consoleWarnSpy.mockRestore();
  });

  it("does not sync while the user is pending email verification", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1", providerData: [], email: "test@example.com" },
      authStatus: "pending_verification",
      setAuthError: mockSetAuthError,
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(ensureUserProfileDocument).not.toHaveBeenCalled();
      expect(upsertCurrentDeviceRegistration).not.toHaveBeenCalled();
    });
  });
});
