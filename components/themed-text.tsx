import { FontWeights } from "@/constants/fontWeights";
import { StyleSheet, Text, type TextProps } from "react-native";
import { FontSizes } from "@/constants/fontSizes";

import { useThemeColor } from "../hooks/use-theme-color";
import { LineHeights } from "@/constants/lineHeights";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: FontSizes.bodyLg,
    lineHeight: LineHeights.titleXl,
  },
  defaultSemiBold: {
    fontSize: FontSizes.bodyLg,
    lineHeight: LineHeights.titleXl,
    fontWeight: FontWeights.semiBold,
  },
  title: {
    fontSize: FontSizes.headingXl,
    fontWeight: FontWeights.bold,
    lineHeight: LineHeights.headingXl,
  },
  subtitle: {
    fontSize: FontSizes.titleMd,
    fontWeight: FontWeights.bold,
  },
  link: {
    lineHeight: LineHeights.headingLg,
    fontSize: FontSizes.bodyLg,
    color: "#0a7ea4",
  },
});
