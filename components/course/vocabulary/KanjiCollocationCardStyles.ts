import { BorderColors } from "@/constants/borderColors";
import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import { StyleSheet } from "react-native";
import { CARD_HEIGHT, CARD_WIDTH } from "../../../src/constants/layout";
import { blackCardSharedStyles, blackCardSpacing } from "./blackCardStyles";

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
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: BorderColors.light.collocationFace,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  faceScroll: {
    flex: 1,
    minHeight: 0,
  },
  faceScrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  imageContainer: {
    height: CARD_HEIGHT * 0.38,
    position: "relative",
    width: "100%",
  },
  cardImage: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignSelf: "stretch",
    marginHorizontal: 4,
    marginTop: blackCardSpacing.contentTop,
    overflow: "hidden",
  },
  kanjiImageTopRightOverlay: {
    ...blackCardSharedStyles.VocaCardTopRightControl,
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
    gap: 16,
  },
  kanjiText: {
    fontSize: FontSizes.displayMega,
    fontWeight: FontWeights.bold,
    textAlign: "left",
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  faceMaskToggleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  faceSection: {
    gap: 4,
  },
  faceSectionLabel: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.extraBold,
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
    fontWeight: FontWeights.semiBold,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: BorderColors.light.collocationFace,
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
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 12,
  },
  furiganaButton: {
    minHeight: 36,
    minWidth: 50,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  furiganaButtonText: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.semiBold,
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
    fontWeight: FontWeights.bold,
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
    borderColor: BorderColors.light.learningCardDividerMuted,
  },
  backGroup: {
    gap: 6,
    marginTop: 4,
  },
  backGroupLabel: {
    fontSize: FontSizes.title,
    fontWeight: FontWeights.bold,
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
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.titleLg,
  },
  backFurigana: {
    fontSize: FontSizes.micro,
    lineHeight: LineHeights.xs,
    alignSelf: "stretch",
    textAlign: "left",
  },
  backFuriganaPlaceholder: {
    color: "transparent",
    backgroundColor: "transparent",
  },
  backFuriganaSpacer: {
    color: "transparent",
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
    color: "transparent",
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
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.bodyLg,
  },
});
