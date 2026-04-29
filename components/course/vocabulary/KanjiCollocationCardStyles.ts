import { FontSizes } from "@/constants/fontSizes";
import { StyleSheet } from "react-native";
import { FontColors } from "../../../constants/fontColors";
import { CARD_HEIGHT, CARD_WIDTH } from "../../../src/constants/layout";
import { blackCardColors, blackCardSpacing } from "./blackCardStyles";
import { LineHeights } from "@/constants/lineHeights";

// const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  card: {
    // height: "100%",
    // width: width * 0.9,
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    alignSelf: "center",
  },
  // Face
  face: {
    flex: 1,
    backgroundColor: blackCardColors.surface,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: blackCardColors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  faceInnerContainer: {
    flex: 6,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  imageContainer: {
    flex: 4,
    position: "relative",
    width: "100%",
  },
  cardImage: {
    flex: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
    marginTop: blackCardSpacing.contentTop,
    overflow: "hidden",
  },
  imageTopRightOverlay: {
    position: "absolute",
    top: 12,
    right: 8,
    zIndex: 3,
  },
  faceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  faceTopRowRight: {
    marginLeft: "auto",
  },
  faceContent: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 18,
  },
  kanjiSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  kanjiText: {
    fontSize: FontSizes.displayMega,
    fontWeight: "bold",
    textAlign: "left",
  },
  faceSection: {
    gap: 4,
  },
  faceSectionLabel: {
    fontSize: FontSizes.bodyLg,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  faceChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  faceListItem: {
    fontSize: FontSizes.title,
    fontWeight: "600",
    lineHeight: LineHeights.heading,
  },
  faceRomanizedTextDark: {
    color: "#b9b9b9",
  },
  faceRomanizedTextLight: {
    color: "#4b5563",
  },
  // Back
  back: {
    flex: 1,
    backgroundColor: blackCardColors.surface,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: blackCardColors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  backHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 4,
  },
  furiganaButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  furiganaButtonText: {
    fontSize: FontSizes.label,
    fontWeight: "600",
  },
  backScroll: {
    flex: 1,
  },
  backScrollContent: {
    paddingHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 16,
  },
  backSection: {
    gap: 8,
  },
  backFlippableRow: {
    width: "100%",
    alignSelf: "stretch",
  },
  backSectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dividerWrapper: {
    height: 1,
    marginVertical: 16,
    overflow: "hidden",
  },
  dividerInner: {
    height: 2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: blackCardColors.dividerMuted,
  },
  backGroup: {
    gap: 6,
    marginTop: 4,
  },
  backGroupLabel: {
    fontSize: FontSizes.title,
    fontWeight: "700",
    lineHeight: LineHeights.titleXl,
  },
  backPairsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 8,
  },
  backItemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  backGeneralExampleItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    gap: 2,
  },
  backPairItem: {
    flexDirection: "column",
    alignItems: "stretch",
    alignSelf: "flex-start",
    gap: 1,
  },
  backPairMainRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignSelf: "stretch",
    alignItems: "center",
    gap: 6,
  },
  backExampleGroup: {
    flexDirection: "column",
    gap: 1,
  },
  backExample: {
    fontSize: FontSizes.bodyLg,
    fontWeight: "500",
    lineHeight: LineHeights.titleLg,
  },
  backFurigana: {
    fontSize: FontSizes.micro,
    lineHeight: LineHeights.xs,
    alignSelf: "stretch",
    textAlign: "left",
  },
  backFuriganaPlaceholder: {
    color: FontColors.light.transparent,
    backgroundColor: "transparent",
  },
  backFuriganaSpacer: {
    color: FontColors.light.transparent,
    backgroundColor: "transparent",
  },
  backInlineFurigana: {
    fontSize: FontSizes.caption,
  },
  backExampleFrame: {
    position: "relative",
    alignSelf: "flex-start",
  },
  backExampleSizer: {
    color: FontColors.light.transparent,
    backgroundColor: "transparent",
  },
  backExampleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  backTranslation: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
    lineHeight: LineHeights.bodyLg,
  },
});
