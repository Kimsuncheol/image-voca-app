import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import type { Locale } from "expo-localization";
import { create } from "zustand";

export const LEGACY_LANGUAGE_STORAGE_KEY = "user_language";
export const LANGUAGE_SETTINGS_STORAGE_KEY = "@languageSettings:v1";

export const SUPPORTED_LANGUAGES = [
  "en-US",
  "en-GB",
  "ko",
  "ja",
  "es",
  "fr",
  "ru",
  "de",
  "it",
  "hi",
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type LanguageMode = "system" | SupportedLanguage;

export interface NationalitySnapshot {
  isKorean: boolean;
  regionCode: string | null;
  languageTag: string | null;
  recommendedStudyPack: "ko-en-bilingual" | null;
}

interface StoredLanguageSettings {
  mode?: unknown;
  nationality?: unknown;
}

interface LanguageSettingsSnapshot {
  mode: LanguageMode;
  systemLanguage: SupportedLanguage;
  effectiveLanguage: SupportedLanguage;
  nationality: NationalitySnapshot;
}

interface LanguageSettingsState extends LanguageSettingsSnapshot {
  _initialized: boolean;
  hydrateSettings: () => Promise<LanguageSettingsSnapshot>;
  setMode: (mode: LanguageMode) => Promise<LanguageSettingsSnapshot>;
  syncDeviceLocales: (locales?: Locale[]) => Promise<LanguageSettingsSnapshot>;
}

export const isSupportedLanguage = (
  value: unknown,
): value is SupportedLanguage =>
  typeof value === "string" &&
  SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);

export const isLanguageMode = (value: unknown): value is LanguageMode =>
  value === "system" || isSupportedLanguage(value);

const getDeviceLocales = () => Localization.getLocales?.() ?? [];

export const normalizeSupportedLanguage = (
  value: unknown,
  regionCode?: unknown,
): SupportedLanguage | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/_/g, "-").toLowerCase();
  const [baseLanguage, localeRegion] = normalized.split("-");

  if (baseLanguage === "en") {
    const region =
      localeRegion?.toUpperCase() ??
      (typeof regionCode === "string" ? regionCode.toUpperCase() : null);
    return region === "GB" ? "en-GB" : "en-US";
  }

  return isSupportedLanguage(baseLanguage) ? baseLanguage : null;
};

export const resolveSystemLanguage = (
  locales: Locale[] = getDeviceLocales(),
): SupportedLanguage => {
  const primaryLocale = locales[0];
  return (
    normalizeSupportedLanguage(primaryLocale?.languageTag, primaryLocale?.regionCode) ??
    normalizeSupportedLanguage(primaryLocale?.languageCode, primaryLocale?.regionCode) ??
    "en-US"
  );
};

export const detectNationality = (
  locales: Locale[] = getDeviceLocales(),
): NationalitySnapshot => {
  const primaryLocale = locales[0];
  const regionCode = primaryLocale?.regionCode?.toUpperCase() ?? null;
  const languageTag = primaryLocale?.languageTag ?? null;
  const isKorean = regionCode === "KR";

  return {
    isKorean,
    regionCode,
    languageTag,
    recommendedStudyPack: isKorean ? "ko-en-bilingual" : null,
  };
};

export const buildLanguageSettingsSnapshot = (
  mode: LanguageMode,
  locales: Locale[] = getDeviceLocales(),
): LanguageSettingsSnapshot => {
  const systemLanguage = resolveSystemLanguage(locales);
  return {
    mode,
    systemLanguage,
    effectiveLanguage: mode === "system" ? systemLanguage : mode,
    nationality: detectNationality(locales),
  };
};

export const normalizeLanguageMode = (value: unknown): LanguageMode | null => {
  if (value === "system") return "system";
  return normalizeSupportedLanguage(value);
};

const normalizeStoredMode = (value: unknown): LanguageMode | null =>
  normalizeLanguageMode(value);

const readStoredMode = async (): Promise<LanguageMode> => {
  const [rawSettings, legacyLanguage] = await Promise.all([
    AsyncStorage.getItem(LANGUAGE_SETTINGS_STORAGE_KEY),
    AsyncStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY),
  ]);

  if (rawSettings) {
    try {
      const parsed = JSON.parse(rawSettings) as StoredLanguageSettings;
      const mode = normalizeStoredMode(parsed.mode);
      if (mode) return mode;
    } catch (error) {
      console.warn("Failed to parse language settings", error);
    }
  }

  const migratedLanguage = normalizeStoredMode(legacyLanguage);
  return migratedLanguage ?? "system";
};

const persistSettings = async (snapshot: LanguageSettingsSnapshot) => {
  await AsyncStorage.setItem(
    LANGUAGE_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      mode: snapshot.mode,
      nationality: snapshot.nationality,
    }),
  );
};

export const useLanguageSettingsStore = create<LanguageSettingsState>(
  (set, get) => ({
    mode: "system",
    systemLanguage: resolveSystemLanguage(),
    effectiveLanguage: resolveSystemLanguage(),
    nationality: detectNationality(),
    _initialized: false,

    hydrateSettings: async () => {
      const mode = await readStoredMode();
      const snapshot = buildLanguageSettingsSnapshot(mode);
      set({ ...snapshot, _initialized: true });
      await persistSettings(snapshot);
      return snapshot;
    },

    setMode: async (mode: LanguageMode) => {
      if (!isLanguageMode(mode)) {
        return get();
      }

      const snapshot = buildLanguageSettingsSnapshot(mode);
      set({ ...snapshot, _initialized: true });
      await persistSettings(snapshot);
      return snapshot;
    },

    syncDeviceLocales: async (locales = getDeviceLocales()) => {
      const snapshot = buildLanguageSettingsSnapshot(get().mode, locales);
      set({ ...snapshot, _initialized: true });
      await persistSettings(snapshot);
      return snapshot;
    },
  }),
);

export const getRecommendedStudyPack = () =>
  useLanguageSettingsStore.getState().nationality.recommendedStudyPack;

export const getIsKoreanNationality = () =>
  useLanguageSettingsStore.getState().nationality.isKorean;
