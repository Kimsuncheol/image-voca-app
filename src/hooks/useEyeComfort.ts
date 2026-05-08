import { useEffect } from "react";
import {
  MAX_EYE_COMFORT_INTENSITY,
  MIN_EYE_COMFORT_INTENSITY,
  useReadingDisplayStore,
} from "../stores/readingDisplayStore";
import type { EyeComfortLevel } from "../utils/eyeComfortColors";

const PRESET_INTENSITY_BY_LEVEL: Record<
  Exclude<EyeComfortLevel, "custom">,
  number
> = {
  low: 0.08,
  medium: 0.14,
  high: 0.22,
};

const CUSTOM_INTENSITY_RANGE =
  MAX_EYE_COMFORT_INTENSITY - MIN_EYE_COMFORT_INTENSITY;

const toCustomIntensityPercent = (intensity: number) =>
  Math.round(
    ((intensity - MIN_EYE_COMFORT_INTENSITY) / CUSTOM_INTENSITY_RANGE) *
      100,
  );

const toCustomIntensityOpacity = (value: number) =>
  MIN_EYE_COMFORT_INTENSITY + CUSTOM_INTENSITY_RANGE * (value / 100);

const toLevel = (intensity: number): EyeComfortLevel => {
  if (intensity === PRESET_INTENSITY_BY_LEVEL.low) return "low";
  if (intensity === PRESET_INTENSITY_BY_LEVEL.medium) return "medium";
  if (intensity === PRESET_INTENSITY_BY_LEVEL.high) return "high";
  return "custom";
};

export function useEyeComfort() {
  const intensity = useReadingDisplayStore(
    (state) => state.eyeComfortIntensity,
  );
  const isEnabled = useReadingDisplayStore(
    (state) => state.eyeComfortEnabled,
  );
  const isInitialized = useReadingDisplayStore(
    (state) => state._initialized,
  );
  const setEyeComfortIntensity = useReadingDisplayStore(
    (state) => state.setEyeComfortIntensity,
  );
  const setEyeComfortEnabled = useReadingDisplayStore(
    (state) => state.setEyeComfortEnabled,
  );
  const toggleEyeComfort = useReadingDisplayStore(
    (state) => state.toggleEyeComfort,
  );
  const hydrate = useReadingDisplayStore((state) => state.hydrate);

  useEffect(() => {
    if (!isInitialized) {
      void hydrate();
    }
  }, [hydrate, isInitialized]);

  const level = toLevel(intensity);

  return {
    level,
    customIntensity: toCustomIntensityPercent(intensity),
    isEnabled,
    setLevel: (nextLevel: EyeComfortLevel) => {
      if (nextLevel === "custom") {
        setEyeComfortIntensity(level === "custom" ? intensity : 0.17);
        return;
      }

      setEyeComfortIntensity(PRESET_INTENSITY_BY_LEVEL[nextLevel]);
    },
    setCustomIntensity: (value: number) => {
      setEyeComfortIntensity(toCustomIntensityOpacity(value));
    },
    toggle: toggleEyeComfort,
    enable: () => setEyeComfortEnabled(true),
    disable: () => setEyeComfortEnabled(false),
    hydrate,
  };
}
