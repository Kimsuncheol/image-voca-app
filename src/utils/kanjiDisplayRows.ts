type KanjiRowSource = {
  meaning?: string | string[];
  meaningKorean?: string[];
  meaningKoreanRomanize?: string[];
  reading?: string[];
  readingKorean?: string[];
  readingKoreanRomanize?: string[];
};

type KanjiDisplayRowInput = {
  korean?: string[];
  base?: string[];
  romanized?: string[];
};

export type KanjiDisplayRow = {
  text: string;
  baseText?: string;
  localizedText?: string;
  speakText: string;
};

const toStringArray = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value : typeof value === "string" ? [value] : value;

const trimAt = (values: string[] | undefined, index: number) => {
  const value = values?.[index]?.trim();
  return value ? value : undefined;
};



const buildRows = (
  { korean, base, romanized }: KanjiDisplayRowInput,
  language: string = "en",
): KanjiDisplayRow[] => {
  const maxLength = Math.max(
    korean?.length ?? 0,
    base?.length ?? 0,
    romanized?.length ?? 0,
  );

  return Array.from({ length: maxLength }, (_, index) => {
    const baseText = trimAt(base, index);
    const koreanText = trimAt(korean, index);
    const romanizedText = trimAt(romanized, index);

    let localizedText: string | undefined;

    const parts: string[] = [];
    if (language === "ko") {
      localizedText = koreanText;
      if (koreanText) parts.push(koreanText);
      if (baseText) parts.push(baseText);
    } else {
      localizedText = romanizedText;
      if (romanizedText) parts.push(romanizedText);
      if (baseText) parts.push(baseText);
    }

    const text = parts.join("    ");

    return {
      text,
      baseText,
      localizedText,
      speakText: baseText || text,
    };
  }).filter((row) => row.text);
};

export const buildKanjiMeaningDisplayRows = (
  source: KanjiRowSource,
  language?: string,
) =>
  buildRows(
    {
      korean: source.meaningKorean,
      base: toStringArray(source.meaning),
      romanized: source.meaningKoreanRomanize,
    },
    language,
  );

export const buildKanjiReadingDisplayRows = (
  source: KanjiRowSource,
  language?: string,
) =>
  buildRows(
    {
      korean: source.readingKorean,
      base: source.reading,
      romanized: source.readingKoreanRomanize,
    },
    language,
  );
