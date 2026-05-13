import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Brightness from "expo-brightness";
import { create } from "zustand";

export type BrightnessMode = "system" | "app";
export type EyeComfortScope = "screen" | "images";

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
  eyeComfortScope: EyeComfortScope;
  isDisplayModalOpen: boolean;
}

export interface ReadingDisplayState extends ReadingDisplaySnapshot {
  setBrightnessMode: (mode: BrightnessMode) => void;
  setAppBrightness: (value: number) => void;
  setBrightnessScopeActive: (isActive: boolean) => void;
  setEyeComfortEnabled: (value: boolean) => void;
  toggleEyeComfort: () => void;
  setEyeComfortIntensity: (value: number) => void;
  setEyeComfortScope: (scope: EyeComfortScope) => void;
  openDisplayModal: () => void;
  closeDisplayModal: () => void;
  hydrate: () => Promise<ReadingDisplaySnapshot>;
}

interface InternalReadingDisplayState extends ReadingDisplayState {
  _initialized: boolean;
  isBrightnessScopeActive: boolean;
}

export const DEFAULT_READING_DISPLAY_SNAPSHOT: ReadingDisplaySnapshot = {
  brightnessMode: "system",
  appBrightness: 0.8,
  eyeComfortEnabled: false,
  eyeComfortIntensity: 0.14,
  eyeComfortScope: "screen",
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

const isEyeComfortScope = (value: unknown): value is EyeComfortScope =>
  value === "screen" || value === "images";

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
    eyeComfortScope: isEyeComfortScope(stored.eyeComfortScope)
      ? stored.eyeComfortScope
      : DEFAULT_READING_DISPLAY_SNAPSHOT.eyeComfortScope,
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

const restoreBrightness = async () => {
  if (typeof capturedBrightness === "number") {
    await Brightness.setBrightnessAsync(capturedBrightness);
  }
  await Brightness.restoreSystemBrightnessAsync();
  capturedBrightness = null;
};

const applyBrightnessMode = (
  snapshot: ReadingDisplaySnapshot,
  isBrightnessScopeActive: boolean,
) => {
  if (snapshot.brightnessMode === "app" && isBrightnessScopeActive) {
    void captureBrightness().finally(() => {
      void Brightness.setBrightnessAsync(snapshot.appBrightness).catch(
        (error) => {
          console.warn("Failed to set app brightness", error);
        },
      );
    });
    return;
  }

  if (!isBrightnessScopeActive && capturedBrightness === null) {
    return;
  }

  void restoreBrightness().catch((error) => {
    console.warn("Failed to restore system brightness", error);
  });
};

const applySnapshot = (
  set: (snapshot: Partial<InternalReadingDisplayState>) => void,
  snapshot: ReadingDisplaySnapshot,
  isBrightnessScopeActive: boolean,
  shouldApplyBrightness = false,
) => {
  set(snapshot);
  void persistReadingDisplay(snapshot).catch((error) => {
    console.warn("Failed to save reading display settings", error);
  });
  if (shouldApplyBrightness) {
    applyBrightnessMode(snapshot, isBrightnessScopeActive);
  }
};

export const useReadingDisplayStore = create<InternalReadingDisplayState>(
  (set, get) => ({
    ...DEFAULT_READING_DISPLAY_SNAPSHOT,
    _initialized: false,
    isBrightnessScopeActive: false,

    hydrate: async () => {
      const snapshot = await readStoredReadingDisplay();
      set({ ...snapshot, _initialized: true });
      applyBrightnessMode(snapshot, get().isBrightnessScopeActive);
      return snapshot;
    },

    setBrightnessMode: (mode) => {
      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          brightnessMode: mode,
        },
        get().isBrightnessScopeActive,
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
        get().isBrightnessScopeActive,
        get().brightnessMode === "app",
      );
    },

    setBrightnessScopeActive: (isActive) => {
      if (get().isBrightnessScopeActive === isActive) {
        return;
      }

      set({ isBrightnessScopeActive: isActive });
      applyBrightnessMode(getSnapshot(get), isActive);
    },

    setEyeComfortEnabled: (value) => {
      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          eyeComfortEnabled: value,
        },
        get().isBrightnessScopeActive,
      );
    },

    toggleEyeComfort: () => {
      const snapshot = getSnapshot(get);
      applySnapshot(
        set,
        {
          ...snapshot,
          eyeComfortEnabled: !snapshot.eyeComfortEnabled,
        },
        get().isBrightnessScopeActive,
      );
    },

    setEyeComfortIntensity: (value) => {
      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          eyeComfortIntensity: normalizeEyeComfortIntensity(value),
        },
        get().isBrightnessScopeActive,
      );
    },

    setEyeComfortScope: (scope) => {
      if (!isEyeComfortScope(scope)) {
        return;
      }

      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          eyeComfortScope: scope,
        },
        get().isBrightnessScopeActive,
      );
    },

    openDisplayModal: () => {
      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          isDisplayModalOpen: true,
        },
        get().isBrightnessScopeActive,
      );
    },

    closeDisplayModal: () => {
      applySnapshot(
        set,
        {
          ...getSnapshot(get),
          isDisplayModalOpen: false,
        },
        get().isBrightnessScopeActive,
      );
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
    eyeComfortScope: state.eyeComfortScope,
    isDisplayModalOpen: state.isDisplayModalOpen,
  };
};

export const __resetReadingDisplayStoreForTests = () => {
  capturedBrightness = null;
  useReadingDisplayStore.setState({
    ...DEFAULT_READING_DISPLAY_SNAPSHOT,
    _initialized: false,
    isBrightnessScopeActive: false,
  });
};
