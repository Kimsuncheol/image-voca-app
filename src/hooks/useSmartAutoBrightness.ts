import * as Brightness from "expo-brightness";
import { LightSensor } from "expo-sensors";
import React from "react";
import { Platform } from "react-native";

export type SmartBrightnessBand = "dark" | "indoor" | "bright";

export interface SmartAutoBrightnessState {
  enabled: boolean;
  permissionStatus: string | null;
  isSensorAvailable: boolean | null;
  lux: number | null;
  band: SmartBrightnessBand | null;
  brightness: number | null;
  error: string | null;
}

const BRIGHTNESS_BY_BAND: Record<SmartBrightnessBand, number> = {
  dark: 0.3,
  indoor: 0.6,
  bright: 1,
};

const INITIAL_STATE: SmartAutoBrightnessState = {
  enabled: false,
  permissionStatus: null,
  isSensorAvailable: null,
  lux: null,
  band: null,
  brightness: null,
  error: null,
};

const getInitialBand = (lux: number): SmartBrightnessBand => {
  if (lux < 50) return "dark";
  if (lux <= 500) return "indoor";
  return "bright";
};

const getHysteresisBand = (
  lux: number,
  previousBand: SmartBrightnessBand | null,
): SmartBrightnessBand => {
  if (!previousBand) {
    return getInitialBand(lux);
  }

  // Hysteresis keeps the current band until lux crosses a wider boundary:
  // dark -> indoor at 60+, indoor -> dark below 40,
  // indoor -> bright above 550, bright -> indoor at 450 or below.
  switch (previousBand) {
    case "dark":
      return lux >= 60 ? "indoor" : "dark";
    case "indoor":
      if (lux < 40) return "dark";
      if (lux > 550) return "bright";
      return "indoor";
    case "bright":
      return lux <= 450 ? "indoor" : "bright";
    default:
      return getInitialBand(lux);
  }
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function useSmartAutoBrightness(): SmartAutoBrightnessState {
  const [state, setState] =
    React.useState<SmartAutoBrightnessState>(INITIAL_STATE);
  const bandRef = React.useRef<SmartBrightnessBand | null>(null);
  const brightnessRef = React.useRef<number | null>(null);
  const initialBrightnessRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const setSafeState = (
      updater:
        | SmartAutoBrightnessState
        | ((current: SmartAutoBrightnessState) => SmartAutoBrightnessState),
    ) => {
      if (!isMounted) return;
      setState(updater);
    };

    const applyLuxReading = async (lux: number) => {
      const band = getHysteresisBand(lux, bandRef.current);
      const nextBrightness = BRIGHTNESS_BY_BAND[band];

      bandRef.current = band;

      setSafeState((current) => ({
        ...current,
        enabled: true,
        lux,
        band,
        brightness: nextBrightness,
        error: null,
      }));

      if (brightnessRef.current === nextBrightness) {
        return;
      }

      brightnessRef.current = nextBrightness;
      try {
        await Brightness.setBrightnessAsync(nextBrightness);
      } catch (error) {
        setSafeState((current) => ({
          ...current,
          error: getErrorMessage(error, "Failed to set screen brightness."),
        }));
      }
    };

    const start = async () => {
      try {
        const brightnessAvailable = await Brightness.isAvailableAsync();
        if (!brightnessAvailable) {
          setSafeState({
            ...INITIAL_STATE,
            isSensorAvailable: false,
            error: "Brightness control is not available on this device.",
          });
          return;
        }

        const permission = await Brightness.requestPermissionsAsync();
        setSafeState((current) => ({
          ...current,
          permissionStatus: permission.status,
        }));

        if (!permission.granted) {
          setSafeState((current) => ({
            ...current,
            enabled: false,
            error: "Brightness permission was not granted.",
          }));
          return;
        }

        const sensorAvailable = await LightSensor.isAvailableAsync();
        if (!sensorAvailable) {
          setSafeState((current) => ({
            ...current,
            enabled: false,
            isSensorAvailable: false,
            error: "Light sensor is not available on this device.",
          }));
          return;
        }

        initialBrightnessRef.current = await Brightness.getBrightnessAsync();
        LightSensor.setUpdateInterval(500);

        setSafeState((current) => ({
          ...current,
          enabled: true,
          isSensorAvailable: true,
          error: null,
        }));

        subscription = LightSensor.addListener(({ illuminance }) => {
          void applyLuxReading(illuminance);
        });
      } catch (error) {
        setSafeState((current) => ({
          ...current,
          enabled: false,
          error: getErrorMessage(
            error,
            "Smart auto-brightness could not be started.",
          ),
        }));
      }
    };

    void start();

    return () => {
      isMounted = false;
      subscription?.remove();

      const previousBrightness = initialBrightnessRef.current;
      if (typeof previousBrightness === "number") {
        void Brightness.setBrightnessAsync(previousBrightness).catch(() => {
          if (Platform.OS === "android") {
            void Brightness.restoreSystemBrightnessAsync().catch(() => {});
          }
        });
      } else if (Platform.OS === "android") {
        void Brightness.restoreSystemBrightnessAsync().catch(() => {});
      }
    };
  }, []);

  return state;
}
