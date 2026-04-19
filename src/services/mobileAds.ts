import { Platform } from "react-native";
import type { NativeAd } from "react-native-google-mobile-ads";
import { isExpoGoRuntime } from "../utils/runtimeEnvironment";

type MobileAdsModule = typeof import("react-native-google-mobile-ads");

let cachedMobileAdsModule: MobileAdsModule | null | undefined;
let mobileAdsInitialization: Promise<unknown> | null = null;

export const getMobileAdsModule = (): MobileAdsModule | null => {
  if (Platform.OS === "web" || isExpoGoRuntime()) {
    cachedMobileAdsModule = null;
    return cachedMobileAdsModule;
  }

  if (cachedMobileAdsModule !== undefined) {
    return cachedMobileAdsModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMobileAdsModule = require("react-native-google-mobile-ads") as
      | MobileAdsModule
      | null;
  } catch {
    cachedMobileAdsModule = null;
  }

  return cachedMobileAdsModule;
};

export const resolveTopInstallNativeAdUnitId = (): string | null => {
  if (Platform.OS === "web" || isExpoGoRuntime()) {
    return null;
  }

  const adsSDK = getMobileAdsModule();
  if (!adsSDK) {
    return null;
  }

  if (__DEV__) {
    return adsSDK.TestIds.NATIVE;
  }

  if (Platform.OS === "android") {
    const unitId = process.env.EXPO_PUBLIC_ADMOB_NATIVE_TOP_BANNER_ANDROID?.trim();
    return unitId || null;
  }

  if (Platform.OS === "ios") {
    const unitId = process.env.EXPO_PUBLIC_ADMOB_NATIVE_TOP_BANNER_IOS?.trim();
    return unitId || null;
  }

  return null;
};

export const initializeMobileAds = async (): Promise<unknown> => {
  if (Platform.OS === "web" || isExpoGoRuntime()) {
    return null;
  }

  const adsSDK = getMobileAdsModule();
  if (!adsSDK) {
    return null;
  }

  if (!mobileAdsInitialization) {
    mobileAdsInitialization = adsSDK.default().initialize().catch((error) => {
      console.warn("Failed to initialize Google Mobile Ads:", error);
      return null;
    });
  }

  return mobileAdsInitialization;
};

export type LoadedNativeAd = Awaited<ReturnType<typeof NativeAd.createForAdRequest>>;
