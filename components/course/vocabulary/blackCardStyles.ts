import { FontSizes } from "@/constants/fontSizes";
import { StyleSheet } from "react-native";

export const blackCardColors = {
  surface: "#000000",
  surfaceAlt: "#050505",
  primary: "#F8F8F8",
  secondary: "#D8D8D8",
  muted: "#9B9BA1",
  faint: "#5C5C62",
  divider: "rgba(255,255,255,0.82)",
  dividerMuted: "rgba(255,255,255,0.24)",
  pill: "rgba(22,34,49,0.88)",
  pillBorder: "rgba(255,255,255,0.08)",
};

export const blackCardSpacing = {
  contentTop: 0,
};

export const blackCardSharedStyles = StyleSheet.create({
  dayPill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: blackCardColors.pill,
    borderWidth: 0.5,
    borderColor: blackCardColors.pillBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayPillText: {
    color: blackCardColors.primary,
    fontSize: FontSizes.body,
    fontWeight: "700",
  },
  topLeftControl: {
    position: "absolute",
    top: 28,
    left: 24,
    zIndex: 5,
  },
  topRightControl: {
    position: "absolute",
    top: 28,
    right: 12,
    zIndex: 5,
  },
  sectionLabel: {
    color: blackCardColors.muted,
    fontSize: FontSizes.bodyLg,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  divider: {
    height: 1.5,
    backgroundColor: blackCardColors.divider,
    opacity: 0.92,
  },
});
