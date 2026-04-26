export const FontSizes = {
  // Micro (8–11): annotations, chips, tab labels, chart axes
  micro: 8,
  xxs: 9,
  xs: 10,
  sm: 11,

  // Body (12–16): regular readable text
  caption: 12,
  label: 13,
  body: 14,
  bodyMd: 15,
  bodyLg: 16,

  // Subheading (17–22): card headers, section labels
  subhead: 17,
  title: 18,
  titleMd: 20,
  titleLg: 22,

  // Heading (24–32): page and screen titles
  heading: 24,
  headingMd: 26,
  headingLg: 28,
  headingXl: 32,

  // Display (34–80): hero text, large kana, big stats
  display: 34,
  displayLg: 40,
  displayXl: 48,
  displayXxl: 52,
  displayHuge: 56,
  displayMega: 64,
  hero: 80,
} as const;

export type FontSizeRole = keyof typeof FontSizes;
export type FontSizeValue = (typeof FontSizes)[FontSizeRole];
