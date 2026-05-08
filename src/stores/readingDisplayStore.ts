import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Brightness from "expo-brightness";
import { create } from "zustand";

export type BrightnessMode = "system" | "app";

export const READING_DISPLAY_STORAGE_KEY = "@readingDisplay:v1";
export const MIN_APP_BRIGHTNESS = 0.05;
export const MAX_APP_BRIGHTNESS = 1;
export const MIN_EYE_COMFORT_INTENSITY = 0.04;
export const MAX_EYE_COMFORT_INTENSITY = 0.3;

export interface ReadingDisplaySnapshot {
  brightnessMode: BrightnessMode;
  appBrightness: number;
  eyeComfortEnabled: boolean;
  eyeComfortIntensity: number;
  isDisplayModalOpen: boolean;
}

export interface ReadingDisplayState extends ReadingDisplaySnapshot {
  setBrightnessMode: (mode: BrightnessMode) => void;
  setAppBrightness: (value: number) => void;
  setEyeComfortEnabled: (value: boolean) => void;
  toggleEyeComfort: () => void;
  setEyeComfortIntensity: (value: number) => void;
  openDisplayModal: () => void;
  closeDisplayModal: () => void;
  hydrate: () => Promise<ReadingDisplaySnapshot>;
}

interface InternalReadingDisplayState extends ReadingDisplayState {
  _initialized: boolean;
}

export const DEFAULT_READING_DISPLAY_SNAPSHOT: ReadingDisplaySnapshot = {
  brightnessMode: "system",
  appBrightness: 0.8,
  eyeComfortEnabled: false,
  eyeComfortIntensity: 0.14,
  isDisplayModalOpen: false,
};

let capturedBrightness: number | null = null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const normalizeAppBrightness = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_READING_DISPLAY_SNAPSHOT.appBrightness;
  }

  return Number(clamp(value, MIN_APP_BRIGHTNESS, MAX_APP_BRIGHTNESS).toFixed(2));
};

export const normalizeEyeComfortIntensity = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_READING_DISPLAY_SNAPSHOT.eyeComfortIntensity;
  }

  return Number(
    clamp(
      value,
      MIN_EYE_COMFORT_INTENSITY,
      MAX_EYE_COMFORT_INTENSITY,
    ).toFixed(3),
  );
};

const isBrightnessMode = (value: unknown): value is BrightnessMode =>
  value === "system" || value === "app";

const normalizeStoredReadingDisplay = (
  value: unknown,
): ReadingDisplaySnapshot => {
  if (!value || typeof value !== "object") {
    return DEFAULT_READING_DISPLAY_SNAPSHOT;
  }

  const stored = value as Partial<
    Record<keyof ReadingDisplaySnapshot, unknown>
  >;

  return {
    brightnessMode: isBrightnessMode(stored.brightnessMode)
      ? stored.brightnessMode
      : DEFAULT_READING_DISPLAY_SNAPSHOT.brightnessMode,
    appBrightness: normalizeAppBrightness(stored.appBrightness),
    eyeComfortEnabled:
      typeof stored.eyeComfortEnabled === "boolean"
        ? stored.eyeComfortEnabled
        : DEFAULT_READING_DISPLAY_SNAPSHOT.eyeComfortEnabled,
    eyeComfortIntensity: normalizeEyeComfortIntensity(
      stored.eyeComfortIntensity,
    ),
    isDisplayModalOpen:
      typeof stored.isDisplayModalOpen === "boolean"
        ? stored.isDisplayModalOpen
        : DEFAULT_READING_DISPLAY_SNAPSHOT.isDisplayModalOpen,
  };
};

const readStoredReadingDisplay =
  async (): Promise<ReadingDisplaySnapshot> => {
    const rawSettings = await AsyncStorage.getItem(
      READING_DISPLAY_STORAGE_KEY,
    );

    if (!rawSettings) {
      return DEFAULT_READING_DISPLAY_SNAPSHOT;
    }

    try {
      return normalizeStoredReadingDisplay(JSON.parse(rawSettings));
    } catch (error) {
      console.warn("Failed to parse reading display settings", error);
      return DEFAULT_READING_DISPLAY_SNAPSHOT;
    }
  };

const persistReadingDisplay = async (snapshot: ReadingDisplaySnapshot) => {
  await AsyncStorage.setItem(
    READING_DISPLAY_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
};

const captureBrightness = async () => {
  if (capturedBrightness !== null) {
    return;
  }

  try {
    capturedBrightness = await Brightness.getBrightnessAsync();
  } catch {
    capturedBrightness = null;
  }
};

const applyBrightnessMode = (snapshot: ReadingDisplaySnapshot) => {
  if (snapshot.brightnessMode === "app") {
    void captureBrightness().finally(() => {
      void Brightness.setBrightnessAsync(snapshot.appBrightness).catch(
        (error) => {
          console.warn("Failed to set app brightness", error);
        },
      );
    });
    return;
  }

  const restore = async () => {
    if (typeof capturedBrightness === "number") {
      await Brightness.setBrightnessAsync(capturedBrightness);
    }
    await Brightness.restoreSystemBrightnessAsync();
    capturedBrightness = null;
  };

  void restore().catch((error) => {
    console.warn("Failed to restore system brightness", error);
  });
};

const applySnapshot = (
  set: (snapshot: Partial<InternalReadingDisplayState>) => void,
  snapshot: ReadingDisplaySnapshot,
  shouldApplyBrightness = false,
) => {
  set(snapshot);
  void persistReadingDisplay(snapshot).catch((error) => {
    console.warn("Failed to save reading display settings", error);
  });
  if (shouldApplyBrightness) {
    applyBrightnessMode(snapshot);
  }
};

export const useReadingDisplayStore = create<InternalReadingDisplayState>(
  (set, get) => ({
    ...DEFAULT_READING_DISPLAY_SNAPSHOT,
    _initialized: false,

    hydrate: async () => {
      const snapshot = await readStoredReadingDisplay();
      set({ ...snapshot, _initialized: true });
      applyBrightnessMode(snapshot);
      return snapshot;
    },

    setBrightnessMode: (mode) => {
      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          brightnessMode: mode,
        },
        true,
      );
    },

    setAppBrightness: (value) => {
      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          appBrightness: normalizeAppBrightness(value),
        },
        get().brightnessMode === "app",
      );
    },

    setEyeComfortEnabled: (value) => {
      applySnapshot(set, {
        ...getSnapshot(get),
        eyeComfortEnabled: value,
      });
    },

    toggleEyeComfort: () => {
      const snapshot = getSnapshot(get);
      applySnapshot(set, {
        ...snapshot,
        eyeComfortEnabled: !snapshot.eyeComfortEnabled,
      });
    },

    setEyeComfortIntensity: (value) => {
      applySnapshot(set, {
        ...getSnapshot(get),
        eyeComfortIntensity: normalizeEyeComfortIntensity(value),
      });
    },

    openDisplayModal: () => {
      applySnapshot(set, {
        ...getSnapshot(get),
        isDisplayModalOpen: true,
      });
    },

    closeDisplayModal: () => {
      applySnapshot(set, {
        ...getSnapshot(get),
        isDisplayModalOpen: false,
      });
    },
  }),
);

const getSnapshot = (
  get: () => InternalReadingDisplayState,
): ReadingDisplaySnapshot => {
  const state = get();

  return {
    brightnessMode: state.brightnessMode,
    appBrightness: state.appBrightness,
    eyeComfortEnabled: state.eyeComfortEnabled,
    eyeComfortIntensity: state.eyeComfortIntensity,
    isDisplayModalOpen: state.isDisplayModalOpen,
  };
};

export const __resetReadingDisplayStoreForTests = () => {
  capturedBrightness = null;
  useReadingDisplayStore.setState({
    ...DEFAULT_READING_DISPLAY_SNAPSHOT,
    _initialized: false,
  });
};
