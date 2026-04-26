import { StyleSheet, Text } from "react-native";
import { FontSizes } from "@/constants/fontSizes";

interface NativeAdCtaButtonProps {
  label: string;
  NativeAsset: any;
  NativeAssetType: any;
}

export function NativeAdCtaButton({
  label,
  NativeAsset,
  NativeAssetType,
}: NativeAdCtaButtonProps) {
  const nonCollapsableProps = { collapsable: false } as Record<string, unknown>;

  return (
    <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
      <Text
        {...nonCollapsableProps}
        style={styles.ctaText}
        testID="top-install-native-ad-cta"
      >
        {label}
      </Text>
    </NativeAsset>
  );
}

const styles = StyleSheet.create({
  ctaText: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 6,
    color: "#ffffff",
    fontSize: FontSizes.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
