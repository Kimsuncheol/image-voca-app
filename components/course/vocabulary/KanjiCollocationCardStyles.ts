import { StyleSheet } from "react-native";
import { CARD_HEIGHT, CARD_WIDTH } from "../../../src/constants/layout";

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
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
  faceInnerContainer: {
    flex: 6,
    padding: 24,
  },
  imageContainer: {
    flex: 4,
    position: "relative",
    width: "100%",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  imageTopRightOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
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
    gap: 20,
  },
  kanjiSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  kanjiText: {
    fontSize: 64,
    fontWeight: "bold",
    textAlign: "left",
  },
  faceSection: {
    gap: 4,
  },
  faceSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  faceChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  faceListItem: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
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
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
  backHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  furiganaButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  furiganaButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  backScroll: {
    flex: 1,
  },
  backScrollContent: {
    padding: 24,
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
    fontSize: 11,
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
  },
  backGroup: {
    gap: 6,
    marginTop: 4,
  },
  backGroupLabel: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
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
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  backFurigana: {
    fontSize: 8,
    lineHeight: 12,
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
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 18,
  },
});
