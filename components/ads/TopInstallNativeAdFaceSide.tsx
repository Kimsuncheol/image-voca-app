import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image as NativeImage, StyleSheet, Text, View } from "react-native";
import type {
  NativeAd,
  NativeAdView as NativeAdViewT,
  NativeAsset as NativeAssetT,
  NativeAssetType as NativeAssetTypeT,
} from "react-native-google-mobile-ads";
import { NativeAdCtaButton } from "./NativeAdCtaButton";
import { NativeAdDisclosureButton } from "./NativeAdDisclosureButton";

type LoadedNativeAd = Awaited<ReturnType<typeof NativeAd.createForAdRequest>>;

// Lazy require so the module crash is caught gracefully in environments
// where the native binary is not available (e.g. Expo Go).
const adsSDK = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-google-mobile-ads") as {
      NativeAdView: typeof NativeAdViewT;
      NativeAsset: typeof NativeAssetT;
      NativeAssetType: typeof NativeAssetTypeT;
    };
  } catch {
    return null;
  }
})();

interface TopInstallNativeAdFaceSideProps {
  ctaLabel: string;
  nativeAd: LoadedNativeAd;
  rating: string | null;
  testID: string;
  onToggleDisclosure: () => void;
}

const BANNER_HEIGHT = 48;

export function TopInstallNativeAdFaceSide({
  ctaLabel,
  nativeAd,
  rating,
  testID,
  onToggleDisclosure,
}: TopInstallNativeAdFaceSideProps) {
  if (!adsSDK) {
    return null;
  }

  const { NativeAdView, NativeAsset, NativeAssetType } = adsSDK;

  return (
    <>
      <NativeAdView nativeAd={nativeAd} style={styles.banner} testID={testID}>
        <View style={styles.iconSlot}>
          {nativeAd.icon?.url ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <NativeImage
                source={{ uri: nativeAd.icon.url }}
                style={styles.icon}
                testID="top-install-native-ad-icon"
              />
            </NativeAsset>
          ) : (
            <View
              style={styles.iconPlaceholder}
              testID="top-install-native-ad-icon"
            />
          )}
        </View>

        <View style={styles.textCluster}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text
              numberOfLines={1}
              style={styles.headline}
              testID="top-install-native-ad-headline"
            >
              {nativeAd.headline}
            </Text>
          </NativeAsset>

          <View style={styles.metadataRow}>
            {rating ? (
              <>
                <Ionicons
                  name="star"
                  size={10}
                  color="#f4b400"
                  testID="top-install-native-ad-star"
                />
                <NativeAsset assetType={NativeAssetType.STAR_RATING}>
                  <Text
                    numberOfLines={1}
                    style={styles.metadataText}
                    testID="top-install-native-ad-rating"
                  >
                    {rating}
                  </Text>
                </NativeAsset>
              </>
            ) : null}

            {nativeAd.store ? (
              <NativeAsset assetType={NativeAssetType.STORE}>
                <Text
                  numberOfLines={1}
                  style={styles.metadataText}
                  testID="metadataRow"
                >
                  {nativeAd.store}
                </Text>
              </NativeAsset>
            ) : null}
            {nativeAd.price ? (
              <NativeAsset assetType={NativeAssetType.PRICE}>
                <Text
                  numberOfLines={1}
                  style={styles.metadataText}
                  testID="top-install-native-ad-headline"
                >
                  {nativeAd.price}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
        </View>
        <NativeAdCtaButton
          label={ctaLabel}
          NativeAsset={NativeAsset}
          NativeAssetType={NativeAssetType}
        />
        <NativeAdDisclosureButton
          bannerHeight={BANNER_HEIGHT}
          onPress={onToggleDisclosure}
        />
      </NativeAdView>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: BANNER_HEIGHT,
    justifyContent: "space-between",
    paddingLeft: 28,
    paddingRight: 12,
    width: "100%",
  },
  iconSlot: {
    justifyContent: "center",
    marginRight: 10,
    minWidth: 30,
  },
  icon: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    height: 30,
    width: 30,
  },
  iconPlaceholder: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    height: 30,
    width: 30,
  },
  textCluster: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  headline: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  metadataRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 1,
  },
  metadataText: {
    color: "#4b5563",
    fontSize: 10,
    lineHeight: 12,
  },
});
