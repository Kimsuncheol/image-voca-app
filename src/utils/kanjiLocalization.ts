type KanjiLocalizedTextSource = {
  meaning?: string | string[];
  meaningKorean?: string[];
  meaningKoreanRomanize?: string[];
  reading?: string[];
  readingKorean?: string[];
  readingKoreanRomanize?: string[];
};

const toStringArray = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value : typeof value === "string" ? [value] : undefined;

const trimAt = (values: string[] | undefined, index: number) => {
  const value = values?.[index]?.trim();
  return value ? value : undefined;
};

const selectByLanguage = (
  language: string | undefined,
  base: string[] | undefined,
  korean: string[] | undefined,
  koreanRomanize: string[] | undefined,
) => {
  const normalizedLanguage = language?.split("-")[0];
  if (normalizedLanguage === "ko") {
    return [korean, base, koreanRomanize];
  }
  if (normalizedLanguage === "en") {
    return [koreanRomanize, korean, base];
  }
  return [base, koreanRomanize, korean];
};

const localizedArray = (
  language: string | undefined,
  base: string[] | undefined,
  korean: string[] | undefined,
  koreanRomanize: string[] | undefined,
) => {
  const sources = selectByLanguage(language, base, korean, koreanRomanize);
  const maxLength = Math.max(0, ...sources.map((source) => source?.length ?? 0));

  return Array.from({ length: maxLength }, (_, index) => {
    for (const source of sources) {
      const value = trimAt(source, index);
      if (value) return value;
    }
    return "";
  });
};

export const getLocalizedKanjiMeanings = (
  source: KanjiLocalizedTextSource,
  language?: string,
) =>
  localizedArray(
    language,
    toStringArray(source.meaning),
    source.meaningKorean,
    source.meaningKoreanRomanize,
  );

export const getLocalizedKanjiReadings = (
  source: KanjiLocalizedTextSource,
  language?: string,
) =>
  localizedArray(
    language,
    source.reading,
    source.readingKorean,
    source.readingKoreanRomanize,
  );
