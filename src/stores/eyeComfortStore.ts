import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  isEyeComfortLevel,
  normalizeEyeComfortCustomIntensity,
  type EyeComfortLevel,
} from "../utils/eyeComfortColors";

export const EYE_COMFORT_STORAGE_KEY = "@eyeComfort:v1";

export interface EyeComfortSnapshot {
  level: EyeComfortLevel;
  customIntensity: number;
  isEnabled: boolean;
}

interface EyeComfortState extends EyeComfortSnapshot {
  _initialized: boolean;
  setLevel: (level: EyeComfortLevel) => void;
  setCustomIntensity: (value: number) => void;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
  hydrate: () => Promise<EyeComfortSnapshot>;
}

export const DEFAULT_EYE_COMFORT_SNAPSHOT: EyeComfortSnapshot = {
  level: "medium",
  customIntensity: 50,
  isEnabled: false,
};

const normalizeStoredEyeComfort = (value: unknown): EyeComfortSnapshot => {
  if (!value || typeof value !== "object") {
    return DEFAULT_EYE_COMFORT_SNAPSHOT;
  }

  const stored = value as Partial<Record<keyof EyeComfortSnapshot, unknown>>;

  return {
    level: isEyeComfortLevel(stored.level)
      ? stored.level
      : DEFAULT_EYE_COMFORT_SNAPSHOT.level,
    customIntensity: normalizeEyeComfortCustomIntensity(
      stored.customIntensity,
    ),
    isEnabled:
      typeof stored.isEnabled === "boolean"
        ? stored.isEnabled
        : DEFAULT_EYE_COMFORT_SNAPSHOT.isEnabled,
  };
};

const readStoredEyeComfort = async (): Promise<EyeComfortSnapshot> => {
  const rawSettings = await AsyncStorage.getItem(EYE_COMFORT_STORAGE_KEY);

  if (!rawSettings) {
    return DEFAULT_EYE_COMFORT_SNAPSHOT;
  }

  try {
    return normalizeStoredEyeComfort(JSON.parse(rawSettings));
  } catch (error) {
    console.warn("Failed to parse eye comfort settings", error);
    return DEFAULT_EYE_COMFORT_SNAPSHOT;
  }
};

const persistEyeComfort = async (snapshot: EyeComfortSnapshot) => {
  await AsyncStorage.setItem(
    EYE_COMFORT_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
};

const applySnapshot = (
  set: (snapshot: EyeComfortSnapshot & { _initialized?: boolean }) => void,
  snapshot: EyeComfortSnapshot,
) => {
  set({ ...snapshot, _initialized: true });
  void persistEyeComfort(snapshot).catch((error) => {
    console.warn("Failed to save eye comfort settings", error);
  });
};

export const useEyeComfortStore = create<EyeComfortState>((set, get) => ({
  ...DEFAULT_EYE_COMFORT_SNAPSHOT,
  _initialized: false,

  hydrate: async () => {
    const snapshot = await readStoredEyeComfort();
    set({ ...snapshot, _initialized: true });
    return snapshot;
  },

  setLevel: (level) => {
    if (!isEyeComfortLevel(level)) {
      return;
    }

    applySnapshot(set, {
      level,
      customIntensity: get().customIntensity,
      isEnabled: get().isEnabled,
    });
  },

  setCustomIntensity: (value) => {
    applySnapshot(set, {
      level: "custom",
      customIntensity: normalizeEyeComfortCustomIntensity(value),
      isEnabled: get().isEnabled,
    });
  },

  toggle: () => {
    const { level, customIntensity, isEnabled } = get();
    applySnapshot(set, {
      level,
      customIntensity,
      isEnabled: !isEnabled,
    });
  },

  enable: () => {
    applySnapshot(set, {
      level: get().level,
      customIntensity: get().customIntensity,
      isEnabled: true,
    });
  },

  disable: () => {
    applySnapshot(set, {
      level: get().level,
      customIntensity: get().customIntensity,
      isEnabled: false,
    });
  },
}));

export const __resetEyeComfortStoreForTests = () => {
  useEyeComfortStore.setState({
    ...DEFAULT_EYE_COMFORT_SNAPSHOT,
    _initialized: false,
  });
};
