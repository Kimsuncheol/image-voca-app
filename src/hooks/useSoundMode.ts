/**
 * useSoundMode Hook
 *
 * Unified hook for detecting device sound mode and volume levels across iOS and Android
 * - iOS: Detects silent switch position + volume level
 * - Android: Detects ringer mode (Normal, Silent, Vibrate) + volume level
 *
 * Note: Requires react-native-volume-manager to be linked.
 * Falls back to "unknown" mode if library is not available (e.g., Expo Go).
 * To enable: run `npx expo prebuild` and rebuild the app.
 */

import { Platform } from "react-native";

export type SoundMode = "normal" | "muted" | "vibrate" | "unknown";
export type VolumeLevel = "muted" | "low" | "medium" | "high";

export interface UseSoundModeReturn {
  /** Current sound mode */
  mode: SoundMode;
  /** Whether device is muted (iOS silent switch or Android silent/DND) */
  isMuted: boolean;
  /** Whether device is in vibrate mode (Android only, false on iOS) */
  isVibrate: boolean;
  /** Whether device is in normal mode */
  isNormal: boolean;
  /** Current volume level (0.0 to 1.0) */
  volume: number;
  /** Volume as percentage (0 to 100) */
  volumePercentage: number;
  /** Volume level category */
  volumeLevel: VolumeLevel;
  /** Whether volume is at 0 */
  isVolumeMuted: boolean;
  /** Whether volume is low (< 30%) */
  isVolumeLow: boolean;
  /** Whether initial query has completed */
  isLoading: boolean;
  /** Platform-specific raw value for debugging */
  rawValue: any;
  /** Whether the native library is available */
  isAvailable: boolean;
}

// Fallback return value when library is not available
const FALLBACK_RETURN: UseSoundModeReturn = {
  mode: "unknown",
  isMuted: false,
  isVibrate: false,
  isNormal: true,
  volume: 0.7, // Assume reasonable default
  volumePercentage: 70,
  volumeLevel: "medium",
  isVolumeMuted: false,
  isVolumeLow: false,
  isLoading: false,
  rawValue: null,
  isAvailable: false,
};

// Try to import the library, but handle gracefully if not available
let volumeManager: any = null;
let RingerModeType: any = null;

try {
  // Attempt to require the native module
  volumeManager = require("react-native-volume-manager");
  if (volumeManager) {
    RingerModeType = volumeManager.RingerModeType;
  }
} catch (error) {
  // Library not linked - this is expected in Expo Go or before prebuild
  console.warn(
    "[useSoundMode] react-native-volume-manager not available. Sound mode detection disabled. Run 'npx expo prebuild' to enable."
  );
}

/**
 * Determines volume level category based on volume value
 */
const getVolumeLevel = (volume: number): VolumeLevel => {
  if (volume === 0) return "muted";
  if (volume < 0.3) return "low";
  if (volume < 0.7) return "medium";
  return "high";
};

/**
 * Custom hook for detecting device sound mode and volume levels
 *
 * @example
 * ```typescript
 * const { mode, isMuted, volume, volumeLevel, isVolumeLow } = useSoundMode();
 *
 * if (!isAvailable) {
 *   console.log("Sound mode detection not available (requires prebuild)");
 * }
 *
 * if (isMuted || isVolumeLow) {
 *   console.log("Device is muted or volume is low, TTS might not be audible");
 * }
 *
 * // Show appropriate icon based on volume level
 * const icon = volumeLevel === 'muted' ? 'volume-mute'
 *            : volumeLevel === 'low' ? 'volume-low'
 *            : volumeLevel === 'medium' ? 'volume-medium'
 *            : 'volume-high';
 * ```
 */
export const useSoundMode = (): UseSoundModeReturn => {
  // If library is not available, return fallback immediately
  if (!volumeManager) {
    return FALLBACK_RETURN;
  }

  try {
    // Get current volume level (works on both iOS and Android)
    const { volume } = volumeManager.useVolume();
    const volumePercentage = Math.round(volume * 100);
    const volumeLevel = getVolumeLevel(volume);
    const isVolumeMuted = volume === 0;
    const isVolumeLow = volume > 0 && volume < 0.3;

    if (Platform.OS === "ios") {
      // iOS: Use silent switch detection + volume
      const { isMuted, initialQuery } = volumeManager.useSilentSwitch();

      return {
        mode: isMuted ? "muted" : "normal",
        isMuted: isMuted,
        isVibrate: false, // iOS doesn't have vibrate-only mode
        isNormal: !isMuted,
        volume,
        volumePercentage,
        volumeLevel,
        isVolumeMuted,
        isVolumeLow,
        isLoading: initialQuery,
        rawValue: { isMuted, volume },
        isAvailable: true,
      };
    } else if (Platform.OS === "android") {
      // Android: Use ringer mode detection + volume
      const { mode: ringerMode, initialValueLoaded } =
        volumeManager.useRingerMode();

      // Map Android ringer modes to our unified mode
      const isSilent = ringerMode === RingerModeType.silent;
      const isVibrate = ringerMode === RingerModeType.vibrate;
      const isNormal = ringerMode === RingerModeType.normal;

      return {
        mode: isSilent
          ? "muted"
          : isVibrate
            ? "vibrate"
            : isNormal
              ? "normal"
              : "unknown",
        isMuted: isSilent,
        isVibrate: isVibrate,
        isNormal: isNormal,
        volume,
        volumePercentage,
        volumeLevel,
        isVolumeMuted,
        isVolumeLow,
        isLoading: !initialValueLoaded,
        rawValue: { ringerMode, volume },
        isAvailable: true,
      };
    }
  } catch (error) {
    // Error using the library - return fallback
    console.warn("[useSoundMode] Error using volume manager:", error);
    return FALLBACK_RETURN;
  }

  // Fallback for unsupported platforms (web, etc.)
  return {
    mode: "unknown",
    isMuted: false,
    isVibrate: false,
    isNormal: true,
    volume: 0.7,
    volumePercentage: 70,
    volumeLevel: "medium",
    isVolumeMuted: false,
    isVolumeLow: false,
    isLoading: false,
    rawValue: null,
    isAvailable: false,
  };
};

export default useSoundMode;
