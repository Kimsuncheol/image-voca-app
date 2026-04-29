import { FontWeights } from "@/constants/fontWeights";
import { BackgroundColors } from "@/constants/backgroundColors";
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";
import { CARD_HEIGHT, CARD_WIDTH } from "@/src/constants/layout";
import { Platform, StyleSheet } from "react-native";
import {
  blackCardColors,
  blackCardSpacing,
} from "../course/vocabulary/blackCardStyles";

export const styles = StyleSheet.create({
  // ============================================================================
  // index.tsx
  // ============================================================================
  card: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    alignSelf: "center",
    backgroundColor: "transparent",
  },

  // ============================================================================
  // FaceSide.tsx
  // ============================================================================
  face: {
    flex: 1,
    backgroundColor: blackCardColors.surface,
    borderRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    justifyContent: "space-between",
    borderWidth: 0,
    borderColor: blackCardColors.surface,
  },
  faceDeleteModeLight: {
    borderColor: "#d0d0d0",
  },
  faceDeleteModeDark: {
    borderColor: "#3a3a3c",
  },
  faceSelectedLight: {
    borderColor: "#007AFF",
    backgroundColor: "#F1F7FF",
  },
  faceSelectedDark: {
    borderColor: "#0A84FF",
    backgroundColor: "#162331",
  },
  faceContentContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  faceTextContainer: {
    flex: 6,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 22,
    paddingHorizontal: 4,
    gap: 12,
    width: "100%",
  },
  faceCollocationRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  faceCollocationWrapper: {
    flex: 1,
    alignItems: "flex-start",
    minWidth: 0,
  },
  faceHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 8,
  },
  faceMeaningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  faceMeaningTextContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
  },
  faceCollocationText: {
    fontSize: FontSizes.displayXl,
    fontWeight: FontWeights.black,
    textAlign: "left",
    color: blackCardColors.primary,
    lineHeight: LineHeights.displayXl,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 0,
  },
  faceCollocationVariantsContainer: {
    gap: 6,
  },
  faceCollocationTextVariant: {
    lineHeight: LineHeights.displayMd,
  },
  faceMeaningText: {
    fontSize: FontSizes.titleLg,
    fontWeight: FontWeights.medium,
    textAlign: "left",
    color: blackCardColors.secondary,
    lineHeight: LineHeights.headingLg,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  faceSynonymsContainer: {
    width: "100%",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  faceSynChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 4,
  },
  faceSynChipText: {
    fontSize: FontSizes.label,
    color: blackCardColors.muted,
    fontWeight: FontWeights.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  faceSynonymsText: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.medium,
    color: blackCardColors.muted,
    lineHeight: LineHeights.titleLg,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  faceTextDark: {
    color: blackCardColors.primary,
  },
  faceFooter: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    minHeight: 52,
  },
  faceSelectionBadge: {
    position: "absolute",
    top: 28,
    left: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    zIndex: 2,
  },
  faceSelectionBadgeSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  faceSelectionBadgeIdleLight: {
    backgroundColor: "#fff",
    borderColor: "#c7c7cc",
  },
  faceSelectionBadgeIdleDark: {
    backgroundColor: "#2c2c2e",
    borderColor: "#636366",
  },
  faceCardImage: {
    flex: 4,
    backgroundColor: BackgroundColors.dark.bgImageColor,
    alignSelf: "stretch",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: "hidden",
    marginHorizontal: 4,
    marginTop: blackCardSpacing.contentTop,
  },

  // ============================================================================
  // BackSide.tsx
  // ============================================================================
  back: {
    flex: 1,
    backgroundColor: blackCardColors.surface,
    borderRadius: 0,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    justifyContent: "space-between",
    borderWidth: 0,
    borderColor: blackCardColors.surface,
  },
  backDark: {
    backgroundColor: blackCardColors.surface,
    borderColor: blackCardColors.surface,
    shadowColor: "#000",
    shadowOpacity: 0,
  },
  backFlipOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },
  backContentContainer: {
    flex: 1,
    minHeight: 0,
    justifyContent: "flex-start",
  },
  backFooter: {
    alignItems: "center",
    paddingBottom: 0,
    height: 52,
    justifyContent: "center",
  },

  // ============================================================================
  // Shared Back Sections (ExplanationSection.tsx & ExampleSection.tsx)
  // ============================================================================
  backSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: blackCardColors.divider,
    marginBottom: 16,
  },
  backSectionLabel: {
    fontSize: FontSizes.titleMd,
    fontWeight: FontWeights.extraBold,
    color: blackCardColors.muted,
    letterSpacing: 1.2,
  },
  backSectionContent: {
    paddingVertical: 12,
    marginBottom: 28,
    flexShrink: 1,
    minHeight: 0,
  },

  // ============================================================================
  // ExplanationSection.tsx
  // ============================================================================
  explanationValue: {
    fontSize: FontSizes.bodyLg,
    color: blackCardColors.primary,
    lineHeight: LineHeights.titleXl,
    fontWeight: FontWeights.medium,
  },

  // ============================================================================
  // ExampleSection.tsx
  // ============================================================================
  exampleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    minHeight: 0,
  },
  exampleContent: {
    flex: 1,
    minHeight: 0,
  },
  exampleScroll: {
    flexGrow: 0,
  },
  exampleScrollContent: {
    paddingBottom: 4,
    gap: 8,
  },
  exampleScrollText: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    flexShrink: 1,
  },
  exampleValue: {
    fontSize: FontSizes.bodyLg,
    color: blackCardColors.primary,
    lineHeight: LineHeights.titleLg,
    fontWeight: FontWeights.medium,
    flexShrink: 1,
  },
  exampleTextDark: {
    color: blackCardColors.primary,
  },
  exampleText: {
    fontStyle: "normal",
    flexShrink: 1,
  },
  exampleCharacterCell: {
    paddingRight: 10,
    justifyContent: "flex-start",
  },
  exampleCharacterText: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.semiBold,
    color: blackCardColors.muted,
    lineHeight: LineHeights.heading,
    flexShrink: 1,
  },
  exampleCharacterTextDark: {
    color: blackCardColors.muted,
  },
  exampleInterleavedContainer: {
    gap: 12,
  },
  exampleItemContainer: {
    gap: 2,
  },
  exampleItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  exampleContentCell: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  exampleTranslationValue: {
    fontSize: FontSizes.bodyMd,
    lineHeight: LineHeights.titleXl,
    fontStyle: "normal",
    flexShrink: 1,
    opacity: 1,
  },

  // ============================================================================
  // TranslationSection.tsx
  // ============================================================================
  translationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 8,
  },
  translationLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: "#999",
    letterSpacing: 1.2,
  },
  translationSectionContent: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  translationValue: {
    fontSize: FontSizes.sm,
    color: "#333",
    lineHeight: LineHeights.bodyLg,
    fontWeight: FontWeights.medium,
  },
  translationScroll: {
    maxHeight: 140,
  },
  translationScrollContent: {
    paddingBottom: 4,
  },
  translationTextDark: {
    color: "#FFFFFF",
  },

  // ============================================================================
  // CollocationSkeleton.tsx
  // ============================================================================
  skeletonCard: {
    minHeight: 480,
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "transparent",
  },
  skeletonFace: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  skeletonBase: {
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
  skeletonAccentMark: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 6,
    height: 24,
    borderRadius: 3,
    transform: [{ rotate: "15deg" }],
  },
  skeletonContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonCollocation: {
    width: "80%",
    height: 48, // Approx line height of collocation text
    marginBottom: 24,
    borderRadius: 8,
  },
  skeletonMeaning: {
    width: "60%",
    height: 28, // Approx line height of meaning text
    borderRadius: 6,
  },
  skeletonFooter: {
    alignItems: "center",
    paddingBottom: 0,
  },
  skeletonIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // ============================================================================
  // CollocationSwipeable.tsx
  // ============================================================================
  swipeableContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeablePagerView: {
    height: CARD_HEIGHT,
    width: "100%",
  },
  swipeablePage: {
    height: CARD_HEIGHT,
  },
  swipeableCardCenteringWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeableCardPlaceholder: {
    width: "90%",
    height: CARD_HEIGHT,
    alignSelf: "center",
  },
  swipeableHintContainer: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  swipeableHintContainerLight: {
    backgroundColor: "rgba(0, 0, 0, 0.78)",
  },
  swipeableHintContainerDark: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  swipeableHintTextLight: {
    color: "#FFFFFF",
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.semiBold,
  },
  swipeableHintTextDark: {
    color: "#FFFFFF",
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.semiBold,
  },
});
