import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { FontSizes } from "@/constants/fontSizes";

const WHY_THIS_AD_URL = "https://adssettings.google.com/whythisad";

interface TopInstallNativeAdBackSideProps {
  overlayWidth: number;
  onClose: () => void;
}

const BANNER_HEIGHT = 56;

export function TopInstallNativeAdBackSide({
  overlayWidth,
  onClose,
}: TopInstallNativeAdBackSideProps) {
  return (
    <Pressable
      onPress={onClose}
      style={styles.inlineDisclosureLayer}
      testID="top-install-native-ad-disclosure-backdrop"
    >
      <View
        style={[
          styles.disclosurePanel,
          overlayWidth > 0 ? { width: overlayWidth } : null,
        ]}
        testID="top-install-native-ad-disclosure-panel"
      >
        <View style={styles.titleRow}>
          <Pressable
            onPress={onClose}
            style={styles.backButton}
            testID="top-install-native-ad-back-button"
          >
            <Ionicons name="arrow-back" size={12} color="#4b5563" />
          </Pressable>
          <Text style={styles.disclosureTitle}>Ads By Google</Text>
          {/* Spacer mirrors the back button width to keep title truly centred */}
          <View style={styles.titleSpacer} />
        </View>
        <View style={styles.disclosureActionsRow}>
          <View style={styles.disclosureGoogleBadge}>
            <Text style={styles.disclosureGoogleBadgeText}>
              Google AdChoices
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL(WHY_THIS_AD_URL)}
            style={styles.disclosureWhyButton}
          >
            <Text style={styles.disclosureWhyButtonText}>Why this ad?</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inlineDisclosureLayer: {
    height: BANNER_HEIGHT,
    justifyContent: "center",
    width: "100%",
    zIndex: 3,
  },
  disclosurePanel: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    height: BANNER_HEIGHT,
    justifyContent: "center",
    paddingVertical: 12,

    width: "100%",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    marginBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  titleSpacer: {
    width: 22, // matches back button hit area width
  },
  disclosureTitle: {
    color: "#1f2937",
    flex: 1,
    fontSize: FontSizes.xs,
    fontWeight: "600",
    lineHeight: 12,
    textAlign: "center",
  },
  disclosureActionsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    width: "100%",
  },
  disclosureGoogleBadge: {
    alignItems: "center",
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  disclosureGoogleBadgeText: {
    color: "#1d4ed8",
    fontSize: FontSizes.xxs,
    fontWeight: "600",
    lineHeight: 11,
  },
  disclosureWhyButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    paddingHorizontal: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  disclosureWhyButtonText: {
    color: "#374151",
    fontSize: FontSizes.xxs,
    fontWeight: "600",
    lineHeight: 11,
  },
});
