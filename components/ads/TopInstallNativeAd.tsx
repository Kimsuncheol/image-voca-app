import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import {
  NativeAd,
  NativeAdEventType,
} from "react-native-google-mobile-ads";
import { resolveTopInstallNativeAdUnitId } from "../../src/services/mobileAds";
import { TopInstallNativeAdBackSide } from "./TopInstallNativeAdBackSide";
import { TopInstallNativeAdFaceSide } from "./TopInstallNativeAdFaceSide";

type LoadedNativeAd = Awaited<ReturnType<typeof NativeAd.createForAdRequest>>;

interface TopInstallNativeAdProps {
  variant?: "light";
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const BANNER_HEIGHT = 48;
const AD_CHOICES_PLACEMENT_BOTTOM_LEFT = 3;

export function TopInstallNativeAd({
  variant = "light",
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
    if (Platform.OS === "web") {
      return;
    }

    const unitId = resolveTopInstallNativeAdUnitId();
    if (!unitId) {
      return;
    }

    let cancelled = false;

    void NativeAd.createForAdRequest(unitId, {
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
    if (!nativeAd) {
      return;
    }

    nativeAdClickSeenRef.current = false;
    nativeAdOpenedRef.current = false;

    const clickSubscription = nativeAd.addAdEventListener?.(
      NativeAdEventType.CLICKED,
      () => {
        nativeAdClickSeenRef.current = true;
      },
    );
    const openedSubscription = nativeAd.addAdEventListener?.(
      NativeAdEventType.OPENED,
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
    if (isDisclosureVisible) {
      closeDisclosurePanel();
      return;
    }

    setIsDisclosureVisible(true);
  }, [closeDisclosurePanel, isDisclosureVisible]);

  if (Platform.OS === "web" || !nativeAd) {
    return null;
  }

  const bannerStyle =
    variant === "light" ? styles.bannerLight : styles.bannerLight;
  const rating = nativeAd.starRating != null
    ? Number(nativeAd.starRating).toFixed(1)
    : null;
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
