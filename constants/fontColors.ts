export type FontColorScheme = "light" | "dark";

export type FontColorRole =
  | "primary"
  | "secondary"
  | "muted"
  | "subtle"
  | "example"
  | "translation"
  | "furigana"
  | "inverse"
  | "transparent";

export type FontColorTokens = Record<FontColorRole, string>;

export const FontColors: Record<FontColorScheme, FontColorTokens> = {
  light: {
    primary: "#1a1a1a",
    secondary: "#1a1a1a",
    muted: "#666",
    subtle: "#666",
    example: "#555",
    translation: "#888",
    furigana: "#999",
    inverse: "#fff",
    transparent: "transparent",
  },
  dark: {
    primary: "#fff",
    secondary: "#e0e0e0",
    muted: "#999",
    subtle: "#aaa",
    example: "#aaa",
    translation: "#777",
    furigana: "#888",
    inverse: "#fff",
    transparent: "transparent",
  },
};

export const getFontColors = (isDark: boolean): FontColorTokens =>
  FontColors[isDark ? "dark" : "light"];
