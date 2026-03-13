import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buildNativeDevicePayload,
  deleteUserDeviceRegistrations,
  isNativeDeviceRegistrationSupported,
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
