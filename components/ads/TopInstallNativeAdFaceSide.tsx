import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image as NativeImage, StyleSheet, Text, View } from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";

type LoadedNativeAd = Awaited<ReturnType<typeof NativeAd.createForAdRequest>>;

interface TopInstallNativeAdFaceSideProps {
  ctaLabel: string;
  nativeAd: LoadedNativeAd;
  rating: string | null;
  testID: string;
  onToggleDisclosure: () => void;
}

const BANNER_HEIGHT = 48;
const DISCLOSURE_COLOR = "#9ca3af";

export function TopInstallNativeAdFaceSide({
  ctaLabel,
  nativeAd,
  rating,
  testID,
  onToggleDisclosure,
}: TopInstallNativeAdFaceSideProps) {
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
                  testID="top-install-native-ad-store"
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
                  testID="top-install-native-ad-price"
                >
                  {nativeAd.price}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
        </View>
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <View
            accessible={true}
            accessibilityRole="button"
            collapsable={false}
            style={styles.ctaButton}
            testID="top-install-native-ad-cta"
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </View>
        </NativeAsset>

        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <View
            accessibilityLabel="Open ad disclosure panel"
            accessibilityRole="button"
            style={styles.disclosureTrigger}
            testID="top-install-native-ad-disclosure-trigger"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={12}
              color={DISCLOSURE_COLOR}
            />
          </View>
        </NativeAsset>
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
    paddingLeft: 38,
    paddingRight: 12,
    width: "100%",
  },
  disclosureTrigger: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: DISCLOSURE_COLOR,
    height: 18,
    justifyContent: "center",
    left: 12,
    position: "absolute",
    top: (BANNER_HEIGHT - 18) / 2,
    width: 18,
    zIndex: 2,
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
  ctaButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  ctaText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
