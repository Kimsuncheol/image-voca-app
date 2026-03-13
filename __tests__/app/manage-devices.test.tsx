import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";
import ManageDevicesScreen from "../../app/manage-devices";
import {
  listUserDeviceRegistrations,
  MAX_REGISTERED_DEVICES,
  removeUserDeviceRegistration,
} from "../../src/services/deviceRegistrationService";

const mockT = (key: string, options?: Record<string, string | number>) =>
  (
    {
      "manageDevices.title": "Manage Devices",
      "manageDevices.subtitle": `${options?.count} / ${options?.max} devices used`,
      "manageDevices.currentBadge": "Current Device",
      "manageDevices.empty": "No registered devices found.",
      "manageDevices.loading": "Loading devices...",
      "manageDevices.error": "Failed to load registered devices.",
      "manageDevices.unknownDevice": "Unknown Device",
      "manageDevices.lastSeen": `Last active: ${options?.date}`,
      "manageDevices.registeredOn": `Registered on: ${options?.date}`,
      "manageDevices.remove": "Remove",
      "manageDevices.removing": "Removing...",
      "manageDevices.confirmTitle": "Remove Device",
      "manageDevices.confirmMessage":
        "Remove this device from your account? You can sign in on it again later if a slot is available.",
      "manageDevices.removeSuccess": "Device removed successfully.",
      "manageDevices.removeError": "Failed to remove the device. Please try again.",
      "manageDevices.helper":
        "To use a newly purchased device, remove one of your old devices here first.",
      "manageDevices.authProvider.password": "Email sign-in",
      "manageDevices.authProvider.google.com": "Google sign-in",
      "manageDevices.authProvider.unknown": "Unknown sign-in method",
      "common.cancel": "Cancel",
      "common.success": "Success",
      "common.error": "Error",
    } as Record<string, string>
  )[key] || key;

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
  }),
}));

jest.mock("../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
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

jest.mock("../../src/services/deviceRegistrationService", () => ({
  MAX_REGISTERED_DEVICES: 3,
  listUserDeviceRegistrations: jest.fn(),
  removeUserDeviceRegistration: jest.fn(),
}));

describe("ManageDevicesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the device count summary and hides remove for the current device", async () => {
    (listUserDeviceRegistrations as jest.Mock).mockResolvedValue([
      {
        deviceId: "device-current",
        modelName: "iPhone 15",
        platform: "ios",
        osVersion: "18",
        appVersion: "1.0.0",
        authProvider: "google.com",
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
        lastSeenAt: "2026-03-05T00:00:00.000Z",
        brand: "Apple",
        manufacturer: "Apple",
        deviceType: "phone",
        osName: "iOS",
        notificationPermissionStatus: "granted",
        expoPushToken: null,
        isCurrentDevice: true,
      },
      {
        deviceId: "device-old",
        modelName: "Galaxy",
        platform: "android",
        osVersion: "15",
        appVersion: "1.0.0",
        authProvider: "password",
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
        lastSeenAt: "2026-03-04T00:00:00.000Z",
        brand: "Samsung",
        manufacturer: "Samsung",
        deviceType: "phone",
        osName: "Android",
        notificationPermissionStatus: "granted",
        expoPushToken: null,
        isCurrentDevice: false,
      },
    ]);

    const { getByText, queryAllByText } = render(<ManageDevicesScreen />);

    await waitFor(() => {
      expect(getByText(`2 / ${MAX_REGISTERED_DEVICES} devices used`)).toBeTruthy();
    });

    expect(getByText("Current Device")).toBeTruthy();
    expect(queryAllByText("Remove")).toHaveLength(1);
  });

  it("shows an empty state when no devices are registered", async () => {
    (listUserDeviceRegistrations as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<ManageDevicesScreen />);

    await waitFor(() => {
      expect(getByText("No registered devices found.")).toBeTruthy();
    });
  });

  it("shows an error state when loading devices fails", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    (listUserDeviceRegistrations as jest.Mock).mockRejectedValue(
      new Error("load failed"),
    );

    const { getByText } = render(<ManageDevicesScreen />);

    await waitFor(() => {
      expect(getByText("Failed to load registered devices.")).toBeTruthy();
    });

    consoleWarnSpy.mockRestore();
  });

  it("confirms and removes a non-current device, then refreshes the list", async () => {
    (listUserDeviceRegistrations as jest.Mock)
      .mockResolvedValueOnce([
        {
          deviceId: "device-current",
          modelName: "iPhone 15",
          platform: "ios",
          osVersion: "18",
          appVersion: "1.0.0",
          authProvider: "google.com",
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
          lastSeenAt: "2026-03-05T00:00:00.000Z",
          brand: "Apple",
          manufacturer: "Apple",
          deviceType: "phone",
          osName: "iOS",
          notificationPermissionStatus: "granted",
          expoPushToken: null,
          isCurrentDevice: true,
        },
        {
          deviceId: "device-old",
          modelName: "Galaxy",
          platform: "android",
          osVersion: "15",
          appVersion: "1.0.0",
          authProvider: "password",
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
          lastSeenAt: "2026-03-04T00:00:00.000Z",
          brand: "Samsung",
          manufacturer: "Samsung",
          deviceType: "phone",
          osName: "Android",
          notificationPermissionStatus: "granted",
          expoPushToken: null,
          isCurrentDevice: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          deviceId: "device-current",
          modelName: "iPhone 15",
          platform: "ios",
          osVersion: "18",
          appVersion: "1.0.0",
          authProvider: "google.com",
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
          lastSeenAt: "2026-03-05T00:00:00.000Z",
          brand: "Apple",
          manufacturer: "Apple",
          deviceType: "phone",
          osName: "iOS",
          notificationPermissionStatus: "granted",
          expoPushToken: null,
          isCurrentDevice: true,
        },
      ]);
    (removeUserDeviceRegistration as jest.Mock).mockResolvedValue(undefined);

    const { getByText, queryByText } = render(<ManageDevicesScreen />);

    await waitFor(() => {
      expect(getByText("Remove")).toBeTruthy();
    });

    fireEvent.press(getByText("Remove"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Remove Device",
      "Remove this device from your account? You can sign in on it again later if a slot is available.",
      expect.any(Array),
    );

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });

    await waitFor(() => {
      expect(removeUserDeviceRegistration).toHaveBeenCalledWith(
        "user-1",
        "device-old",
      );
      expect(listUserDeviceRegistrations).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(queryByText("Galaxy")).toBeNull();
    });
  });
});
