import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Locale } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import hi from "./locales/hi";
import it from "./locales/it";
import ja from "./locales/ja";
import ko from "./locales/ko";
import ru from "./locales/ru";
import {
  LEGACY_LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  normalizeLanguageMode,
  normalizeSupportedLanguage,
  resolveSystemLanguage,
  useLanguageSettingsStore,
  type LanguageMode,
  type SupportedLanguage,
} from "./stores/languageSettingsStore";

export const LANGUAGE_STORAGE_KEY = LEGACY_LANGUAGE_STORAGE_KEY;
export { SUPPORTED_LANGUAGES };
export type { LanguageMode, SupportedLanguage };

const resources = {
  "en-US": { translation: en },
  "en-GB": { translation: en },
  "en-AU": { translation: en },
  "en-NZ": { translation: en },
  "en-IE": { translation: en },
  "en-CA": { translation: en },
  ko: { translation: ko },
  ja: { translation: ja },
  es: { translation: es },
  fr: { translation: fr },
  ru: { translation: ru },
  de: { translation: de },
  it: { translation: it },
  hi: { translation: hi },
};

i18n.use(initReactI18next).init({
  resources,
  lng: resolveSystemLanguage(),
  fallbackLng: "en-US",
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
  const nextMode = normalizeLanguageMode(mode) ?? "system";
  const snapshot = await useLanguageSettingsStore.getState().setMode(nextMode);

  if (nextMode === "system") {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } else {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextMode);
  }

  await i18n.changeLanguage(snapshot.effectiveLanguage);
};

export const setLanguage = async (language: SupportedLanguage | "en") => {
  const normalizedLanguage = normalizeSupportedLanguage(language);
  const nextLanguage =
    normalizedLanguage && isSupportedLanguage(normalizedLanguage)
      ? normalizedLanguage
      : "en-US";
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

  return normalizeSupportedLanguage(i18n.language) ?? "en-US";
};

export default i18n;
