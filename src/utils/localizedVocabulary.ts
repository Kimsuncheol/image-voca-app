import type { SupportedLanguage } from "../i18n";
import type {
  LocalizedVocabularyContent,
  VocabularyLocalizationMap,
} from "../types/vocabulary";

export type LocalizedContentLanguage = "en" | "ko";

export interface LocalizedVocabularySource {
  word: string;
  meaning: string;
  translation?: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  example?: string;
  exampleRoman?: string;
  imageUrl?: string;
  localized?: VocabularyLocalizationMap;
}

export interface ResolvedVocabularyContent {
  language: LocalizedContentLanguage;
  word: string;
  meaning: string;
  translation?: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  example: string;
  exampleRoman?: string;
  imageUrl?: string;
  sharedPronunciation?: string;
  localizedPronunciation?: string;
}

const normalizeTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeLocalizedContent = (
  value: unknown,
): LocalizedVocabularyContent | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const content = value as Record<string, unknown>;
  const normalized: LocalizedVocabularyContent = {
    meaning: normalizeTrimmedString(content.meaning),
    pronunciation: normalizeTrimmedString(content.pronunciation),
    translation: normalizeTrimmedString(content.translation),
  };

  return normalized.meaning || normalized.pronunciation || normalized.translation
    ? normalized
    : undefined;
};

export const normalizeVocabularyLocalizationMap = (
  value: unknown,
): VocabularyLocalizationMap | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const localized = value as Record<string, unknown>;
  const normalized: VocabularyLocalizationMap = {
    en: normalizeLocalizedContent(localized.en),
    ko: normalizeLocalizedContent(localized.ko),
  };

  return normalized.en || normalized.ko ? normalized : undefined;
};

export const resolveLocalizedContentLanguage = (
  language?: string,
): LocalizedContentLanguage => (language === "ko" ? "ko" : "en");

const pickLocalizedContent = (
  localized: VocabularyLocalizationMap | undefined,
  language: LocalizedContentLanguage,
) => localized?.[language] ?? localized?.en;

const getLocalizedValue = (
  localized: LocalizedVocabularyContent | undefined,
  key: keyof LocalizedVocabularyContent,
  fallback?: string,
) => {
  const localizedValue = normalizeTrimmedString(localized?.[key]);
  return localizedValue ?? normalizeTrimmedString(fallback);
};

export const resolveVocabularyContent = (
  source: LocalizedVocabularySource,
  language?: SupportedLanguage | string,
): ResolvedVocabularyContent => {
  const resolvedLanguage = resolveLocalizedContentLanguage(language);
  const localized = pickLocalizedContent(source.localized, resolvedLanguage);
  const sharedPronunciation = normalizeTrimmedString(source.pronunciation);
  const localizedPronunciation = getLocalizedValue(
    localized,
    "pronunciation",
    source.pronunciation,
  );

  return {
    language: resolvedLanguage,
    word: source.word,
    meaning: getLocalizedValue(localized, "meaning", source.meaning) ?? "",
    translation: getLocalizedValue(localized, "translation", source.translation),
    pronunciation: sharedPronunciation,
    pronunciationRoman: normalizeTrimmedString(source.pronunciationRoman),
    example: source.example?.trim() ?? "",
    exampleRoman: normalizeTrimmedString(source.exampleRoman),
    imageUrl: normalizeTrimmedString(source.imageUrl),
    sharedPronunciation,
    localizedPronunciation,
  };
};
