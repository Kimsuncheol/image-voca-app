import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image as NativeImage, StyleSheet, Text, View } from "react-native";
import { FontSizes } from "@/constants/fontSizes";
import type {
  NativeAdView as NativeAdViewT,
  NativeAsset as NativeAssetT,
  NativeAssetType as NativeAssetTypeT,
} from "react-native-google-mobile-ads";
import {
  getMobileAdsModule,
  type LoadedNativeAd,
} from "../../src/services/mobileAds";
import { NativeAdCtaButton } from "./NativeAdCtaButton";
import { NativeAdDisclosureButton } from "./NativeAdDisclosureButton";
import { LineHeights } from "@/constants/lineHeights";

interface TopInstallNativeAdFaceSideProps {
  ctaLabel: string;
  nativeAd: LoadedNativeAd;
  rating: string | null;
  testID: string;
  onToggleDisclosure: () => void;
}

const BANNER_HEIGHT = 56;

export function TopInstallNativeAdFaceSide({
  ctaLabel,
  nativeAd,
  rating,
  testID,
  onToggleDisclosure,
}: TopInstallNativeAdFaceSideProps) {
  const adsSDK = getMobileAdsModule() as {
    NativeAdView: typeof NativeAdViewT;
    NativeAsset: typeof NativeAssetT;
    NativeAssetType: typeof NativeAssetTypeT;
  } | null;

  if (!adsSDK) {
    return null;
  }

  const { NativeAdView, NativeAsset, NativeAssetType } = adsSDK;

  return (
    <View style={styles.wrapper}>
      {/* NativeAdView intercepts all touches on Android — keep NativeAdDisclosureButton OUTSIDE */}
      <NativeAdView nativeAd={nativeAd} style={styles.banner} testID={testID}>
        <View style={styles.iconSlot}>
          {nativeAd.icon?.url ? (
            <NativeImage
              source={{ uri: nativeAd.icon.url }}
              style={styles.icon}
              testID="top-install-native-ad-icon"
            />
          ) : (
            <View
              style={styles.iconPlaceholder}
              testID="top-install-native-ad-icon"
            />
          )}
        </View>

        <View style={styles.textCluster}>
          <Text
            numberOfLines={1}
            style={styles.headline}
            testID="top-install-native-ad-headline"
          >
            {nativeAd.headline}
          </Text>

          <View style={styles.metadataRow}>
            {rating ? (
              <>
                <Ionicons
                  name="star"
                  size={10}
                  color="#f4b400"
                  testID="top-install-native-ad-star"
                />
                <Text
                  numberOfLines={1}
                  style={styles.metadataText}
                  testID="top-install-native-ad-rating"
                >
                  {rating}
                </Text>
              </>
            ) : null}

            {nativeAd.store ? (
              <Text
                numberOfLines={1}
                style={styles.metadataText}
                testID="metadataRow"
              >
                {nativeAd.store}
              </Text>
            ) : null}
            {nativeAd.price ? (
              <Text
                numberOfLines={1}
                style={styles.metadataText}
                testID="top-install-native-ad-price"
              >
                {nativeAd.price}
              </Text>
            ) : null}
          </View>
        </View>
        <NativeAdCtaButton
          label={ctaLabel}
          NativeAsset={NativeAsset}
          NativeAssetType={NativeAssetType}
        />
      </NativeAdView>

      {/* Rendered outside NativeAdView so Android doesn't swallow its onPress */}
      <NativeAdDisclosureButton
        bannerHeight={BANNER_HEIGHT}
        onPress={onToggleDisclosure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
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
    fontSize: FontSizes.caption,
    fontWeight: "700",
    lineHeight: LineHeights.sm,
  },
  metadataRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 1,
  },
  metadataText: {
    color: "#4b5563",
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
});
