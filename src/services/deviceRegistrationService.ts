import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { Platform } from "react-native";
import type {
  DeviceRegistrationRecord,
  ManageableDeviceRecord,
} from "../types/deviceRegistration";
import { db } from "./firebase";
import { getPrimaryAuthProvider } from "./userProfileService";

const DEVICE_ID_STORAGE_KEY = "@device_registration_id";
export const MAX_REGISTERED_DEVICES = 3;

export class DeviceRegistrationLimitError extends Error {
  code = "device/limit-exceeded" as const;

  constructor(message = "Registered device limit reached.") {
    super(message);
    this.name = "DeviceRegistrationLimitError";
  }
}

const getPlatform = (): DeviceRegistrationRecord["platform"] | null => {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return null;
};

const getDeviceTypeLabel = (): string | null => {
  switch (Device.deviceType) {
    case Device.DeviceType.PHONE:
      return "phone";
    case Device.DeviceType.TABLET:
      return "tablet";
    case Device.DeviceType.DESKTOP:
      return "desktop";
    case Device.DeviceType.TV:
      return "tv";
    case Device.DeviceType.UNKNOWN:
    default:
      return null;
  }
};

const createDeviceId = async () => {
  const seed = `${Platform.OS}:${Date.now()}:${Math.random()}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    seed,
  );
  return `device_${hash.slice(0, 24)}`;
};

export const isNativeDeviceRegistrationSupported = () => getPlatform() !== null;

export const getOrCreateDeviceId = async () => {
  const existingDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const deviceId = await createDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
};

export const buildNativeDevicePayload = async (
  user: Pick<User, "email" | "providerData">,
) => {
  const platform = getPlatform();
  if (!platform) return null;

  return {
    platform,
    brand: Device.brand ?? null,
    manufacturer: Device.manufacturer ?? null,
    modelName: Device.modelName ?? null,
    deviceType: getDeviceTypeLabel(),
    osName: Device.osName ?? null,
    osVersion: Device.osVersion ?? null,
    appVersion: Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null,
    appBuild: Constants.nativeBuildVersion ?? null,
    authProvider: getPrimaryAuthProvider(user),
  };
};

export const upsertCurrentDeviceRegistration = async (
  user: Pick<User, "uid" | "email" | "providerData">,
) => {
  if (!isNativeDeviceRegistrationSupported()) return null;

  const deviceId = await getOrCreateDeviceId();
  const deviceRef = doc(db, "users", user.uid, "devices", deviceId);
  const snapshot = await getDoc(deviceRef);
  const existing = snapshot.exists()
    ? (snapshot.data() as Partial<DeviceRegistrationRecord>)
    : undefined;

  if (!existing) {
    const deviceSnapshot = await getDocs(collection(db, "users", user.uid, "devices"));
    if (deviceSnapshot.docs.length >= MAX_REGISTERED_DEVICES) {
      throw new DeviceRegistrationLimitError();
    }
  }

  const payload = await buildNativeDevicePayload(user);
  if (!payload) return null;
  const now = new Date().toISOString();

  const record: DeviceRegistrationRecord = {
    deviceId,
    ...payload,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastSeenAt: now,
  };

  await setDoc(deviceRef, record, { merge: true });
  return record;
};

export const deleteUserDeviceRegistrations = async (userId: string) => {
  const snapshot = await getDocs(collection(db, "users", userId, "devices"));
  await Promise.all(
    snapshot.docs.map((deviceDoc) =>
      deleteDoc(doc(db, "users", userId, "devices", deviceDoc.id)),
    ),
  );
};

const getTimestampValue = (value?: string | null) => {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const listUserDeviceRegistrations = async (
  userId: string,
): Promise<ManageableDeviceRecord[]> => {
  const currentDeviceId = await getOrCreateDeviceId();
  const snapshot = await getDocs(collection(db, "users", userId, "devices"));

  return snapshot.docs
    .map((deviceDoc) => {
      const data = deviceDoc.data() as DeviceRegistrationRecord;
      return {
        ...data,
        deviceId: data.deviceId || deviceDoc.id,
        isCurrentDevice: (data.deviceId || deviceDoc.id) === currentDeviceId,
      };
    })
    .sort((left, right) => {
      if (left.isCurrentDevice && !right.isCurrentDevice) return -1;
      if (!left.isCurrentDevice && right.isCurrentDevice) return 1;
      return getTimestampValue(right.lastSeenAt) - getTimestampValue(left.lastSeenAt);
    });
};

export const removeUserDeviceRegistration = async (
  userId: string,
  deviceId: string,
) => {
  await deleteDoc(doc(db, "users", userId, "devices", deviceId));
};
