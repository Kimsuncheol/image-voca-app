export type FontColorScheme = "light" | "dark";

export type FontColorRole =
  | "primary"
  | "secondary"
  | "muted"
  | "subtle"
  | "example"
  | "translation"
  | "furigana"
  | "body"
  | "supporting"
  | "tertiary"
  | "placeholder"
  | "error"
  | "success"
  | "link"
  | "sectionMeta"
  | "iconMuted"
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
    body: "#333",
    supporting: "#666",
    tertiary: "#999",
    placeholder: "#999",
    error: "#DC3545",
    success: "green",
    link: "#007AFF",
    sectionMeta: "#6e6e73",
    iconMuted: "#666",
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
    body: "#fff",
    supporting: "#ccc",
    tertiary: "#888",
    placeholder: "#666",
    error: "#FF6B6B",
    success: "green",
    link: "#007AFF",
    sectionMeta: "#8e8e93",
    iconMuted: "#888",
    inverse: "#fff",
    transparent: "transparent",
  },
};

export const getFontColors = (isDark: boolean): FontColorTokens =>
  FontColors[isDark ? "dark" : "light"];
