export type DevicePlatform = "ios" | "android";

export interface DeviceRegistrationRecord {
  deviceId: string;
  platform: DevicePlatform;
  brand: string | null;
  manufacturer: string | null;
  modelName: string | null;
  deviceType: string | null;
  osName: string | null;
  osVersion: string | null;
  appVersion: string | null;
  appBuild: string | null;
  authProvider: string;
  notificationPermissionStatus: string;
  expoPushToken: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}
