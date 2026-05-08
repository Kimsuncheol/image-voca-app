export type EyeComfortTheme = "light" | "dark";
export type EyeComfortLevel = "low" | "medium" | "high" | "custom";

export const EYE_COMFORT_LEVELS: EyeComfortLevel[] = [
  "low",
  "medium",
  "high",
  "custom",
];

type PresetEyeComfortLevel = Exclude<EyeComfortLevel, "custom">;

export const EYE_COMFORT_OVERLAY_COLORS: Record<
  EyeComfortTheme,
  Record<PresetEyeComfortLevel, string>
> = {
  light: {
    low: "rgba(255, 160, 60, 0.08)",
    medium: "rgba(255, 160, 60, 0.14)",
    high: "rgba(255, 160, 60, 0.22)",
  },
  dark: {
    low: "rgba(255, 150, 80, 0.06)",
    medium: "rgba(255, 150, 80, 0.10)",
    high: "rgba(255, 150, 80, 0.16)",
  },
};

export const isEyeComfortLevel = (
  value: unknown,
): value is EyeComfortLevel =>
  typeof value === "string" &&
  EYE_COMFORT_LEVELS.includes(value as EyeComfortLevel);

const EYE_COMFORT_CUSTOM_OPACITY_RANGE: Record<
  EyeComfortTheme,
  { min: number; max: number }
> = {
  light: { min: 0.08, max: 0.22 },
  dark: { min: 0.06, max: 0.16 },
};

export const normalizeEyeComfortCustomIntensity = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

const formatOpacity = (value: number) => value.toFixed(2);

export const getEyeComfortOverlayColor = ({
  isDark,
  level,
  customIntensity = 50,
}: {
  isDark: boolean;
  level: EyeComfortLevel;
  customIntensity?: number;
}) => {
  const theme = isDark ? "dark" : "light";

  if (level !== "custom") {
    return EYE_COMFORT_OVERLAY_COLORS[theme][level];
  }

  const normalizedIntensity =
    normalizeEyeComfortCustomIntensity(customIntensity);
  const { min, max } = EYE_COMFORT_CUSTOM_OPACITY_RANGE[theme];
  const opacity = min + (max - min) * (normalizedIntensity / 100);
  const color = isDark ? "255, 150, 80" : "255, 160, 60";

  return `rgba(${color}, ${formatOpacity(opacity)})`;
};
