import { Platform } from "react-native";
import mobileAds, { TestIds } from "react-native-google-mobile-ads";

let mobileAdsInitialization: Promise<unknown> | null = null;

export const resolveTopInstallNativeAdUnitId = (): string | null => {
  if (__DEV__) {
    return TestIds.NATIVE;
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
  if (Platform.OS === "web") {
    return null;
  }

  if (!mobileAdsInitialization) {
    mobileAdsInitialization = mobileAds().initialize().catch((error) => {
      console.warn("Failed to initialize Google Mobile Ads:", error);
      return null;
    });
  }

  return mobileAdsInitialization;
};
