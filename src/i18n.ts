import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import ko from "./locales/ko";

export const LANGUAGE_STORAGE_KEY = "user_language";
export const SUPPORTED_LANGUAGES = ["en", "ko", "ja"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  ko: { translation: ko },
  ja: { translation: ja },
};

const getDeviceLanguage = (): SupportedLanguage => {
  const finder = (Localization as {
    findBestLanguageTag?: (langs: string[]) => {
      languageTag?: string;
      languageCode?: string;
    } | null;
  }).findBestLanguageTag;

  const best = finder ? finder([...SUPPORTED_LANGUAGES]) : null;
  if (
    best?.languageTag &&
    SUPPORTED_LANGUAGES.includes(best.languageTag as SupportedLanguage)
  ) {
    return best.languageTag as SupportedLanguage;
  }
  if (
    best?.languageCode &&
    SUPPORTED_LANGUAGES.includes(best.languageCode as SupportedLanguage)
  ) {
    return best.languageCode as SupportedLanguage;
  }

  const locales = Localization.getLocales?.() ?? [];
  for (const locale of locales) {
    const tag = locale.languageTag as SupportedLanguage;
    const code = locale.languageCode as SupportedLanguage;
    if (SUPPORTED_LANGUAGES.includes(tag)) return tag;
    if (SUPPORTED_LANGUAGES.includes(code)) return code;
  }
  return "en";
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: "en",
  compatibilityJSON: "v3",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const hydrateLanguage = async () => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      await i18n.changeLanguage(stored);
    }
  } catch (error) {
    console.warn("Failed to load stored language", error);
  }
};

export const setLanguage = async (language: SupportedLanguage) => {
  const nextLanguage = SUPPORTED_LANGUAGES.includes(language)
    ? language
    : "en";
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  await i18n.changeLanguage(nextLanguage);
};

export const getCurrentLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch (error) {
    console.warn("Failed to load current language", error);
  }

  const activeLanguage = i18n.language?.split("-")[0] as SupportedLanguage;
  return SUPPORTED_LANGUAGES.includes(activeLanguage) ? activeLanguage : "en";
};

export default i18n;
