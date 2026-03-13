import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buildNativeDevicePayload,
  DeviceRegistrationLimitError,
  deleteUserDeviceRegistrations,
  isNativeDeviceRegistrationSupported,
  listUserDeviceRegistrations,
  MAX_REGISTERED_DEVICES,
  removeUserDeviceRegistration,
  upsertCurrentDeviceRegistration,
} from "../../src/services/deviceRegistrationService";
import {
  collection,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  nativeAppVersion: "1.0.0",
  nativeBuildVersion: "100",
  expoConfig: {
    version: "1.0.0",
    extra: {
      eas: {
        projectId: "project-123",
      },
    },
  },
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: {
    SHA256: "SHA256",
  },
  digestStringAsync: jest.fn(async () => "0123456789abcdef0123456789abcdef"),
}));

jest.mock("expo-device", () => ({
  DeviceType: {
    UNKNOWN: 0,
    PHONE: 1,
    TABLET: 2,
    DESKTOP: 3,
    TV: 4,
  },
  brand: "Apple",
  manufacturer: "Apple",
  modelName: "iPhone 15",
  deviceType: 1,
  osName: "iOS",
  osVersion: "18.1",
}));

jest.mock("expo-notifications", () => ({
  IosAuthorizationStatus: {
    PROVISIONAL: 3,
  },
  getPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db, ...segments: string[]) => segments.join("/")),
  deleteDoc: jest.fn(),
  doc: jest.fn((_db, ...segments: string[]) => segments.join("/")),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  db: {},
}));

const mockSnapshot = (data?: Record<string, unknown>) => ({
  exists: () => Boolean(data),
  data: () => data,
});

const makeDeviceDoc = (
  id: string,
  data: Record<string, unknown>,
) => ({
  id,
  data: () => data,
});

describe("deviceRegistrationService", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    Platform.OS = "ios";
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (getDoc as jest.Mock).mockResolvedValue(mockSnapshot());
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("stores the full operational payload when permissions are granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: true,
      ios: { status: 0 },
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: "ExponentPushToken[token-123]",
    });

    const record = await upsertCurrentDeviceRegistration({
      uid: "user-1",
      email: "test@example.com",
      providerData: [{ providerId: "password" }] as any,
    });

    expect(record).toEqual(
      expect.objectContaining({
        deviceId: "device_0123456789abcdef01234567",
        platform: "ios",
        modelName: "iPhone 15",
        authProvider: "password",
        notificationPermissionStatus: "granted",
        expoPushToken: "ExponentPushToken[token-123]",
      }),
    );
    expect(setDoc).toHaveBeenCalledWith(
      "users/user-1/devices/device_0123456789abcdef01234567",
      expect.objectContaining({
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        lastSeenAt: expect.any(String),
      }),
      { merge: true },
    );
    expect(getDocs).toHaveBeenCalledWith("users/user-1/devices");
  });

  it("stores a null Expo push token when notification permission is not granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: false,
      canAskAgain: true,
      ios: { status: 0 },
    });

    const payload = await buildNativeDevicePayload({
      email: "test@example.com",
      providerData: [{ providerId: "password" }] as any,
    });

    expect(payload).toEqual(
      expect.objectContaining({
        notificationPermissionStatus: "undetermined",
        expoPushToken: null,
      }),
    );
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("does not throw when Expo push token fetching fails", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: false,
      ios: { status: 0 },
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
      new Error("token failed"),
    );

    const record = await upsertCurrentDeviceRegistration({
      uid: "user-1",
      email: "test@example.com",
      providerData: [{ providerId: "password" }] as any,
    });

    expect(record?.expoPushToken).toBeNull();
    expect(setDoc).toHaveBeenCalled();
  });

  it("skips registration entirely on web", async () => {
    Platform.OS = "web";

    const record = await upsertCurrentDeviceRegistration({
      uid: "user-1",
      email: "test@example.com",
      providerData: [{ providerId: "password" }] as any,
    });

    expect(isNativeDeviceRegistrationSupported()).toBe(false);
    expect(record).toBeNull();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("updates the same device document for an existing signed-in device", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      "device_existingdeviceid123456",
    );
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: false,
      ios: { status: 0 },
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: "ExponentPushToken[token-123]",
    });
    (getDoc as jest.Mock).mockResolvedValue(
      mockSnapshot({
        createdAt: "2026-03-01T00:00:00.000Z",
      }),
    );
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: "device-a" }, { id: "device-b" }, { id: "device-c" }],
    });

    const record = await upsertCurrentDeviceRegistration({
      uid: "user-1",
      email: "test@example.com",
      providerData: [{ providerId: "google.com" }] as any,
    });

    expect(setDoc).toHaveBeenCalledWith(
      "users/user-1/devices/device_existingdeviceid123456",
      expect.objectContaining({
        deviceId: "device_existingdeviceid123456",
        authProvider: "google.com",
        createdAt: "2026-03-01T00:00:00.000Z",
      }),
      { merge: true },
    );
    expect(record?.updatedAt).toEqual(expect.any(String));
    expect(record?.lastSeenAt).toEqual(expect.any(String));
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("allows a new device registration while the user is below the cap", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: false,
      ios: { status: 0 },
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: "ExponentPushToken[token-123]",
    });
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: "device-a" }, { id: "device-b" }],
    });

    const record = await upsertCurrentDeviceRegistration({
      uid: "user-1",
      email: "test@example.com",
      providerData: [{ providerId: "password" }] as any,
    });

    expect(record?.deviceId).toBe("device_0123456789abcdef01234567");
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("throws a device limit error when a new device would exceed the cap", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: new Array(MAX_REGISTERED_DEVICES).fill(null).map((_, index) => ({
        id: `device-${index}`,
      })),
    });

    await expect(
      upsertCurrentDeviceRegistration({
        uid: "user-1",
        email: "test@example.com",
        providerData: [{ providerId: "password" }] as any,
      }),
    ).rejects.toBeInstanceOf(DeviceRegistrationLimitError);

    expect(setDoc).not.toHaveBeenCalled();
  });

  it("lists device docs, marks the current device, and sorts by current then lastSeenAt", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("device-current");
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        makeDeviceDoc("device-old", {
          deviceId: "device-old",
          platform: "ios",
          brand: "Apple",
          manufacturer: "Apple",
          modelName: "iPhone 13",
          deviceType: "phone",
          osName: "iOS",
          osVersion: "17",
          appVersion: "1.0.0",
          appBuild: "100",
          authProvider: "password",
          notificationPermissionStatus: "granted",
          expoPushToken: null,
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
          lastSeenAt: "2026-03-03T00:00:00.000Z",
        }),
        makeDeviceDoc("device-current", {
          deviceId: "device-current",
          platform: "ios",
          brand: "Apple",
          manufacturer: "Apple",
          modelName: "iPhone 15",
          deviceType: "phone",
          osName: "iOS",
          osVersion: "18",
          appVersion: "1.0.0",
          appBuild: "100",
          authProvider: "google.com",
          notificationPermissionStatus: "granted",
          expoPushToken: null,
          createdAt: "2026-03-02T00:00:00.000Z",
          updatedAt: "2026-03-02T00:00:00.000Z",
          lastSeenAt: "2026-03-02T00:00:00.000Z",
        }),
        makeDeviceDoc("device-newer", {
          deviceId: "device-newer",
          platform: "android",
          brand: "Samsung",
          manufacturer: "Samsung",
          modelName: "Galaxy",
          deviceType: "phone",
          osName: "Android",
          osVersion: "15",
          appVersion: "1.0.0",
          appBuild: "100",
          authProvider: "password",
          notificationPermissionStatus: "granted",
          expoPushToken: null,
          createdAt: "2026-03-04T00:00:00.000Z",
          updatedAt: "2026-03-04T00:00:00.000Z",
          lastSeenAt: "2026-03-04T00:00:00.000Z",
        }),
      ],
    });

    const devices = await listUserDeviceRegistrations("user-1");

    expect(devices.map((device) => device.deviceId)).toEqual([
      "device-current",
      "device-newer",
      "device-old",
    ]);
    expect(devices[0]?.isCurrentDevice).toBe(true);
    expect(devices[1]?.isCurrentDevice).toBe(false);
  });

  it("removes a specified device doc", async () => {
    await removeUserDeviceRegistration("user-1", "device-old");

    expect(deleteDoc).toHaveBeenCalledWith("users/user-1/devices/device-old");
  });

  it("deletes all device documents before account cleanup continues", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: "device-a" }, { id: "device-b" }],
    });

    await deleteUserDeviceRegistrations("user-1");

    expect(collection).toHaveBeenCalledWith({}, "users", "user-1", "devices");
    expect(deleteDoc).toHaveBeenCalledTimes(2);
    expect(deleteDoc).toHaveBeenNthCalledWith(
      1,
      "users/user-1/devices/device-a",
    );
    expect(deleteDoc).toHaveBeenNthCalledWith(
      2,
      "users/user-1/devices/device-b",
    );
  });
});
