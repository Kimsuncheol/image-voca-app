import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBackgroundColors } from "../../constants/backgroundColors";
import { useTheme } from "../../src/context/ThemeContext";
import { getMobileAdsModule } from "../../src/services/mobileAds";

export interface TopBannerAdProps {
  includeTopInset?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

type MobileAdsModule = NonNullable<ReturnType<typeof getMobileAdsModule>>;
type AdLoadState = "loading" | "loaded" | "failed";

const resolveBannerAdUnitId = (adsSDK: MobileAdsModule): string | null => {
  if (__DEV__) {
    return adsSDK.TestIds.ADAPTIVE_BANNER;
  }

  return process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID?.trim() || null;
};

export function TopBannerAd({
  includeTopInset = true,
  containerStyle,
  testID = "top-banner-ad",
}: TopBannerAdProps) {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const [adLoadState, setAdLoadState] =
    React.useState<AdLoadState>("loading");

  const adsSDK = getMobileAdsModule();
  const adUnitId = adsSDK ? resolveBannerAdUnitId(adsSDK) : null;

  if (Platform.OS === "web" || !adsSDK || !adUnitId || adLoadState === "failed") {
    return null;
  }

  const { BannerAd, BannerAdSize } = adsSDK;
  const wrapperStyle = [
    styles.wrapper,
    {
      backgroundColor: bgColors.screen,
      borderBottomColor: bgColors.separator,
    },
    adLoadState === "loaded" && styles.loadedWrapper,
    containerStyle,
  ];

  const banner = (
    <View style={wrapperStyle} testID={testID}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setAdLoadState("loaded")}
        onAdFailedToLoad={(error) => {
          console.warn("Failed to load top banner ad:", error);
          setAdLoadState("failed");
        }}
      />
    </View>
  );

  if (!includeTopInset) {
    return banner;
  }

  return <SafeAreaView edges={["top"]}>{banner}</SafeAreaView>;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: "100%",
  },
  loadedWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
});
