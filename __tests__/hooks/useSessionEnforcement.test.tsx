import { render, waitFor } from "@testing-library/react-native";
import { signOut } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import React from "react";
import { useSessionEnforcement } from "../../src/hooks/useSessionEnforcement";
import {
  getCurrentDeviceSessionId,
  getOrCreateDeviceId,
  isNativeDeviceRegistrationSupported,
} from "../../src/services/deviceRegistrationService";

const mockSetAuthError = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, ...segments: string[]) => segments.join("/")),
  onSnapshot: jest.fn(),
}));

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../src/services/deviceRegistrationService", () => ({
  getCurrentDeviceSessionId: jest.fn(),
  getOrCreateDeviceId: jest.fn(),
  isNativeDeviceRegistrationSupported: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  auth: {},
  db: {},
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "auth.errors.forcedLogout"
        ? "Your account was signed in on another device. You have been logged out."
        : key,
  }),
}));

function TestComponent() {
  useSessionEnforcement();
  return null;
}

const captureSnapshotCallback = () => {
  let snapshotCallback: ((snap: unknown) => void) | undefined;
  (onSnapshot as jest.Mock).mockImplementation(
    (_ref: unknown, callback: (snap: unknown) => void) => {
      snapshotCallback = callback;
      return jest.fn();
    },
  );
  return () => snapshotCallback;
};

const makeSnapshot = (data: Record<string, unknown> | null) => ({
  exists: () => data !== null,
  get: (key: string) => (data ? data[key] : undefined),
});

describe("useSessionEnforcement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (signOut as jest.Mock).mockResolvedValue(undefined);
    (isNativeDeviceRegistrationSupported as jest.Mock).mockReturnValue(true);
    (getOrCreateDeviceId as jest.Mock).mockResolvedValue("device-current");
    (getCurrentDeviceSessionId as jest.Mock).mockResolvedValue("session-current");
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      authStatus: "signed_in",
      setAuthError: mockSetAuthError,
    });
    (onSnapshot as jest.Mock).mockReturnValue(jest.fn());
  });

  it("subscribes to the user document when signed in", async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(onSnapshot).toHaveBeenCalledWith(
        "users/user-1",
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  it("does not subscribe when the user is not signed in", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      authStatus: "signed_out",
      setAuthError: mockSetAuthError,
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  it("does not subscribe on unsupported platforms", async () => {
    (isNativeDeviceRegistrationSupported as jest.Mock).mockReturnValue(false);

    render(<TestComponent />);

    await waitFor(() => {
      expect(onSnapshot).not.toHaveBeenCalled();
      expect(getOrCreateDeviceId).not.toHaveBeenCalled();
    });
  });

  it("does nothing when activeSessionDeviceId matches the current device", async () => {
    const getCallback = captureSnapshotCallback();
    render(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(makeSnapshot({ activeSessionDeviceId: "device-current" }));

    expect(signOut).not.toHaveBeenCalled();
    expect(mockSetAuthError).not.toHaveBeenCalled();
  });

  it("does nothing when activeSessionDeviceId and activeSessionId match", async () => {
    const getCallback = captureSnapshotCallback();
    render(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(
      makeSnapshot({
        activeSessionDeviceId: "device-current",
        activeSessionId: "session-current",
      }),
    );

    expect(signOut).not.toHaveBeenCalled();
    expect(mockSetAuthError).not.toHaveBeenCalled();
  });

  it("forces logout when the device matches but the session id is replaced", async () => {
    const getCallback = captureSnapshotCallback();
    render(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(
      makeSnapshot({
        activeSessionDeviceId: "device-current",
        activeSessionId: "session-other",
      }),
    );

    await waitFor(() => {
      expect(mockSetAuthError).toHaveBeenCalledWith(
        "Your account was signed in on another device. You have been logged out.",
      );
      expect(signOut).toHaveBeenCalledWith({});
    });
  });

  it("does nothing when activeSessionDeviceId is absent", async () => {
    const getCallback = captureSnapshotCallback();
    render(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(makeSnapshot({}));

    expect(signOut).not.toHaveBeenCalled();
    expect(mockSetAuthError).not.toHaveBeenCalled();
  });

  it("does nothing when the snapshot document does not exist", async () => {
    const getCallback = captureSnapshotCallback();
    render(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(makeSnapshot(null));

    expect(signOut).not.toHaveBeenCalled();
    expect(mockSetAuthError).not.toHaveBeenCalled();
  });

  it("forces logout and sets error when another device claims the session", async () => {
    const getCallback = captureSnapshotCallback();
    render(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(makeSnapshot({ activeSessionDeviceId: "device-other" }));

    await waitFor(() => {
      expect(mockSetAuthError).toHaveBeenCalledWith(
        "Your account was signed in on another device. You have been logged out.",
      );
      expect(signOut).toHaveBeenCalledWith({});
    });
  });

  it("does not fire forced logout more than once per session", async () => {
    const getCallback = captureSnapshotCallback();
    render(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(makeSnapshot({ activeSessionDeviceId: "device-other" }));
    getCallback()!(makeSnapshot({ activeSessionDeviceId: "device-other" }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  it("unsubscribes when the component unmounts", async () => {
    const mockUnsubscribe = jest.fn();
    (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<TestComponent />);

    await waitFor(() => expect(onSnapshot).toHaveBeenCalled());
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("resets forced-logout guard when user signs out and back in", async () => {
    const getCallback = captureSnapshotCallback();

    const { rerender } = render(<TestComponent />);
    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(makeSnapshot({ activeSessionDeviceId: "device-other" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));

    mockUseAuth.mockReturnValue({
      user: null,
      authStatus: "signed_out",
      setAuthError: mockSetAuthError,
    });
    rerender(<TestComponent />);

    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      authStatus: "signed_in",
      setAuthError: mockSetAuthError,
    });
    rerender(<TestComponent />);

    await waitFor(() => expect(getCallback()).toBeDefined());
    getCallback()!(makeSnapshot({ activeSessionDeviceId: "device-other" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(2));
  });
});
