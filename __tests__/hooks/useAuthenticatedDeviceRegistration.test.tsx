import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { useAuthenticatedDeviceRegistration } from "../../src/hooks/useAuthenticatedDeviceRegistration";
import { ensureUserProfileDocument } from "../../src/services/userProfileService";
import { upsertCurrentDeviceRegistration } from "../../src/services/deviceRegistrationService";

const mockUseAuth = jest.fn();

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../src/services/userProfileService", () => ({
  ensureUserProfileDocument: jest.fn(),
}));

jest.mock("../../src/services/deviceRegistrationService", () => ({
  upsertCurrentDeviceRegistration: jest.fn(),
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
  });

  it("syncs the user profile and device once when a user session becomes available", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1", providerData: [], email: "test@example.com" },
    });

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
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1", providerData: [], email: "test@example.com" },
    });

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
    });

    const view = render(<TestComponent />);

    await waitFor(() => {
      expect(upsertCurrentDeviceRegistration).toHaveBeenCalledTimes(1);
    });

    mockUseAuth.mockReturnValue({
      user: { uid: "user-2", providerData: [], email: "two@example.com" },
    });
    view.rerender(<TestComponent />);

    await waitFor(() => {
      expect(upsertCurrentDeviceRegistration).toHaveBeenCalledTimes(2);
    });
  });
});
