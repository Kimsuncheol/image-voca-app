import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type {
  NativeAd,
  NativeAdEventType,
} from "react-native-google-mobile-ads";
import { resolveTopInstallNativeAdUnitId } from "../../src/services/mobileAds";
import { TopInstallNativeAdBackSide } from "./TopInstallNativeAdBackSide";
import { TopInstallNativeAdFaceSide } from "./TopInstallNativeAdFaceSide";

type LoadedNativeAd = Awaited<ReturnType<typeof NativeAd.createForAdRequest>>;

// Lazy require so the module crash is caught gracefully in environments
// where the native binary is not available (e.g. Expo Go).
const adsSDK = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-google-mobile-ads") as {
      NativeAd: typeof NativeAd;
      NativeAdEventType: typeof NativeAdEventType;
    };
  } catch {
    return null;
  }
})();

interface TopInstallNativeAdProps {
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const AD_CHOICES_PLACEMENT_BOTTOM_LEFT = 3;

export function TopInstallNativeAd({
  containerStyle,
  testID = "top-install-native-ad",
}: TopInstallNativeAdProps) {
  const [nativeAd, setNativeAd] = React.useState<LoadedNativeAd | null>(null);
  const [isDisclosureVisible, setIsDisclosureVisible] = React.useState(false);
  const [overlayWidth, setOverlayWidth] = React.useState<number>(0);
  const nativeAdRef = React.useRef<LoadedNativeAd | null>(null);
  const nativeAdClickSeenRef = React.useRef(false);
  const nativeAdOpenedRef = React.useRef(false);

  React.useEffect(() => {
    if (Platform.OS === "web" || !adsSDK) {
      return;
    }

    const unitId = resolveTopInstallNativeAdUnitId();
    if (!unitId) {
      return;
    }

    let cancelled = false;

    void adsSDK.NativeAd.createForAdRequest(unitId, {
      adChoicesPlacement: AD_CHOICES_PLACEMENT_BOTTOM_LEFT,
    })
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
      setIsDisclosureVisible(false);
      nativeAdRef.current?.destroy?.();
      nativeAdRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!nativeAd || !adsSDK) {
      return;
    }

    nativeAdClickSeenRef.current = false;
    nativeAdOpenedRef.current = false;

    const clickSubscription = nativeAd.addAdEventListener?.(
      adsSDK.NativeAdEventType.CLICKED,
      () => {
        nativeAdClickSeenRef.current = true;
      },
    );
    const openedSubscription = nativeAd.addAdEventListener?.(
      adsSDK.NativeAdEventType.OPENED,
      () => {
        nativeAdOpenedRef.current = true;
      },
    );

    return () => {
      clickSubscription?.remove?.();
      openedSubscription?.remove?.();
      nativeAd.removeAllAdEventListeners?.();
    };
  }, [nativeAd]);

  const closeDisclosurePanel = React.useCallback(() => {
    setIsDisclosureVisible(false);
  }, []);

  const toggleDisclosurePanel = React.useCallback(() => {
    setIsDisclosureVisible((prev) => !prev);
    console.log("toggleDisclosurePanel");
  }, []);

  if (Platform.OS === "web" || !nativeAd) {
    return null;
  }

  const rating =
    nativeAd.starRating != null ? Number(nativeAd.starRating).toFixed(1) : null;
  const ctaLabel = nativeAd.callToAction?.trim()
    ? nativeAd.callToAction.trim().toUpperCase()
    : "INSTALL";

  return (
    <>
      <View
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== overlayWidth) {
            setOverlayWidth(nextWidth);
          }
        }}
        style={[styles.wrapper, containerStyle]}
        testID={testID}
      >
        {isDisclosureVisible ? (
          <TopInstallNativeAdBackSide
            onClose={closeDisclosurePanel}
            overlayWidth={overlayWidth}
          />
        ) : (
          <TopInstallNativeAdFaceSide
            ctaLabel={ctaLabel}
            nativeAd={nativeAd}
            onToggleDisclosure={toggleDisclosurePanel}
            rating={rating}
            testID={`${testID}-face`}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
});
