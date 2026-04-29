
export const FontWeights = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
  black: "900",
} as const;

export type FontWeightRole = keyof typeof FontWeights;
export type FontWeightValue = (typeof FontWeights)[FontWeightRole];
