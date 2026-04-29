export const LineHeights = {
  // Micro/Caption
  micro: 11,
  xs: 12,
  sm: 14,

  // Body text
  body: 15,
  bodyMd: 16,
  bodyLg: 18,
  bodyXl: 19,

  // Subheading/Title
  title: 20,
  titleMd: 21,
  titleLg: 22,
  titleXl: 24,

  // Heading
  heading: 26,
  headingMd: 28,
  headingLg: 30,
  headingXl: 32,
  headingXxl: 34,

  // Display
  display: 48,
  displayMd: 50,
  displayLg: 52,
  displayXl: 56,
} as const;

export type LineHeightRole = keyof typeof LineHeights;
export type LineHeightValue = (typeof LineHeights)[LineHeightRole];
