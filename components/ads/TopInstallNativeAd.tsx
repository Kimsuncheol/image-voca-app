import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image as NativeImage,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";
import { resolveTopInstallNativeAdUnitId } from "../../src/services/mobileAds";

type LoadedNativeAd = Awaited<ReturnType<typeof NativeAd.createForAdRequest>>;

interface TopInstallNativeAdProps {
  variant?: "light";
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const BANNER_HEIGHT = 40;

export function TopInstallNativeAd({
  variant = "light",
  containerStyle,
  testID = "top-install-native-ad",
}: TopInstallNativeAdProps) {
  const [nativeAd, setNativeAd] = React.useState<LoadedNativeAd | null>(null);
  const nativeAdRef = React.useRef<LoadedNativeAd | null>(null);

  React.useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const unitId = resolveTopInstallNativeAdUnitId();
    if (!unitId) {
      return;
    }

    let cancelled = false;

    void NativeAd.createForAdRequest(unitId)
      .then((ad) => {
        if (cancelled) {
          ad.destroy?.();
          return;
        }
        nativeAdRef.current = ad;
        setNativeAd(ad);
      })
      .catch((error) => {
        console.warn("Failed to load top native install ad:", error);
      });

    return () => {
      cancelled = true;
      nativeAdRef.current?.destroy?.();
      nativeAdRef.current = null;
    };
  }, []);

  if (Platform.OS === "web" || !nativeAd) {
    return null;
  }

  const bannerStyle =
    variant === "light" ? styles.bannerLight : styles.bannerLight;
  const rating = nativeAd.starRating != null
    ? Number(nativeAd.starRating).toFixed(1)
    : null;

  return (
    <NativeAdView
      nativeAd={nativeAd}
      style={[styles.banner, bannerStyle, containerStyle]}
      testID={testID}
    >
      <View style={styles.leftCluster}>
        {nativeAd.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <NativeImage
              source={{ uri: nativeAd.icon.url }}
              style={styles.icon}
              testID="top-install-native-ad-icon"
            />
          </NativeAsset>
        ) : (
          <View style={styles.iconPlaceholder} testID="top-install-native-ad-icon" />
        )}

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
      </View>

      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <Pressable
          accessibilityRole="button"
          style={styles.ctaButton}
          testID="top-install-native-ad-cta"
        >
          <Text style={styles.ctaText}>OPEN</Text>
        </Pressable>
      </NativeAsset>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    flexDirection: "row",
    height: BANNER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    width: "100%",
  },
  bannerLight: {
    backgroundColor: "#ffffff",
  },
  leftCluster: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
  },
  icon: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    height: 24,
    marginRight: 8,
    width: 24,
  },
  iconPlaceholder: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    height: 24,
    marginRight: 8,
    width: 24,
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
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ctaText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
