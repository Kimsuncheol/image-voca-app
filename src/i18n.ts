import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Locale } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import ko from "./locales/ko";
import {
  LEGACY_LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  isLanguageMode,
  isSupportedLanguage,
  resolveSystemLanguage,
  useLanguageSettingsStore,
  type LanguageMode,
  type SupportedLanguage,
} from "./stores/languageSettingsStore";

export const LANGUAGE_STORAGE_KEY = LEGACY_LANGUAGE_STORAGE_KEY;
export { SUPPORTED_LANGUAGES };
export type { LanguageMode, SupportedLanguage };

const resources = {
  en: { translation: en },
  ko: { translation: ko },
  ja: { translation: ja },
};

i18n.use(initReactI18next).init({
  resources,
  lng: resolveSystemLanguage(),
  fallbackLng: "en",
  compatibilityJSON: "v4",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const hydrateLanguage = async () => {
  try {
    const snapshot =
      await useLanguageSettingsStore.getState().hydrateSettings();
    await i18n.changeLanguage(snapshot.effectiveLanguage);
  } catch (error) {
    console.warn("Failed to load stored language", error);
  }
};

export const setLanguageMode = async (mode: LanguageMode) => {
  const nextMode = isLanguageMode(mode) ? mode : "system";
  const snapshot = await useLanguageSettingsStore.getState().setMode(nextMode);

  if (nextMode === "system") {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } else {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextMode);
  }

  await i18n.changeLanguage(snapshot.effectiveLanguage);
};

export const setLanguage = async (language: SupportedLanguage) => {
  const nextLanguage = isSupportedLanguage(language) ? language : "en";
  await setLanguageMode(nextLanguage);
};

export const syncLanguageWithSystemLocales = async (locales?: Locale[]) => {
  const previousLanguage =
    useLanguageSettingsStore.getState().effectiveLanguage;
  const snapshot =
    await useLanguageSettingsStore.getState().syncDeviceLocales(locales);

  if (
    snapshot.mode === "system" &&
    snapshot.effectiveLanguage !== previousLanguage
  ) {
    await i18n.changeLanguage(snapshot.effectiveLanguage);
  }

  return snapshot;
};

export const getCurrentLanguage = async (): Promise<SupportedLanguage> => {
  const state = useLanguageSettingsStore.getState();
  if (!state._initialized) {
    await hydrateLanguage();
  }

  const activeLanguage = i18n.language?.split("-")[0] as SupportedLanguage;
  return isSupportedLanguage(activeLanguage) ? activeLanguage : "en";
};

export default i18n;
