import { StyleSheet, Text } from "react-native";

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
  return (
    <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
      <Text style={styles.ctaText} testID="top-install-native-ad-cta">
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
