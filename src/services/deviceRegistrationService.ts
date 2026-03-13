import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
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
import type { DeviceRegistrationRecord } from "../types/deviceRegistration";
import { db } from "./firebase";
import { getPrimaryAuthProvider } from "./userProfileService";

const DEVICE_ID_STORAGE_KEY = "@device_registration_id";

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

const getNotificationPermissionState = async () => {
  const permissions = await Notifications.getPermissionsAsync();
  const notificationPermissionStatus =
    permissions.granted ? "granted" : permissions.canAskAgain ? "undetermined" : "denied";
  const isGranted =
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  return {
    notificationPermissionStatus,
    isGranted,
  };
};

const getExpoProjectId = () => {
  const constantsWithExtras = Constants as typeof Constants & {
    easConfig?: { projectId?: string };
    expoConfig?: { extra?: { eas?: { projectId?: string } } };
  };

  return (
    constantsWithExtras.easConfig?.projectId ||
    constantsWithExtras.expoConfig?.extra?.eas?.projectId ||
    undefined
  );
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

  const { notificationPermissionStatus, isGranted } =
    await getNotificationPermissionState();
  const projectId = getExpoProjectId();

  let expoPushToken: string | null = null;
  if (isGranted && projectId) {
    try {
      const response = await Notifications.getExpoPushTokenAsync({ projectId });
      expoPushToken = response.data;
    } catch (error) {
      console.warn("Failed to fetch Expo push token", error);
    }
  }

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
    notificationPermissionStatus,
    expoPushToken,
  };
};

export const upsertCurrentDeviceRegistration = async (
  user: Pick<User, "uid" | "email" | "providerData">,
) => {
  if (!isNativeDeviceRegistrationSupported()) return null;

  const deviceId = await getOrCreateDeviceId();
  const payload = await buildNativeDevicePayload(user);
  if (!payload) return null;

  const deviceRef = doc(db, "users", user.uid, "devices", deviceId);
  const snapshot = await getDoc(deviceRef);
  const existing = snapshot.exists()
    ? (snapshot.data() as Partial<DeviceRegistrationRecord>)
    : undefined;
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
