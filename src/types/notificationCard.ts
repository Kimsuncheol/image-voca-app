import type {
  CourseType,
  KanjiNestedListGroup,
  VocabularyLocalizationMap,
} from "./vocabulary";

export type NotificationCardKind = "collocation" | "kanji";

interface NotificationCardPayloadBase {
  type: "pop_word";
  cardKind: NotificationCardKind;
  course: CourseType | string;
  id?: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  example?: string;
  exampleFurigana?: string;
  exampleHurigana?: string;
  translation?: string;
  synonyms?: string[];
  imageUrl?: string;
  localized?: VocabularyLocalizationMap;
}

export interface NotificationCollocationCardPayload
  extends NotificationCardPayloadBase {
  cardKind: "collocation";
}

export interface NotificationKanjiCardPayload {
  type: "pop_word";
  cardKind: "kanji";
  course: CourseType | string;
  id?: string;
  kanji: string;
  meaningSummary: string;
  readingSummary: string;
  imageUrl?: string;
  // All nested array fields serialized as JSON strings to fit notification data limits
  meaning: string;
  meaningKorean: string;
  meaningKoreanRomanize: string;
  reading: string;
  readingKorean: string;
  readingKoreanRomanize: string;
  meaningExample: string;
  meaningExampleHurigana: string;
  meaningEnglishTranslation: string;
  meaningKoreanTranslation: string;
  readingExample: string;
  readingExampleHurigana: string;
  readingEnglishTranslation: string;
  readingKoreanTranslation: string;
  example: string;
  exampleHurigana: string;
  exampleEnglishTranslation: string;
  exampleKoreanTranslation: string;
}

export interface DeserializedKanjiNotificationPayload {
  meaning: string[];
  meaningKorean: string[];
  meaningKoreanRomanize: string[];
  reading: string[];
  readingKorean: string[];
  readingKoreanRomanize: string[];
  meaningExample: KanjiNestedListGroup[];
  meaningExampleHurigana: KanjiNestedListGroup[];
  meaningEnglishTranslation: KanjiNestedListGroup[];
  meaningKoreanTranslation: KanjiNestedListGroup[];
  readingExample: KanjiNestedListGroup[];
  readingExampleHurigana: KanjiNestedListGroup[];
  readingEnglishTranslation: KanjiNestedListGroup[];
  readingKoreanTranslation: KanjiNestedListGroup[];
  example: string[];
  exampleHurigana: string[];
  exampleEnglishTranslation: string[];
  exampleKoreanTranslation: string[];
}

export function deserializeKanjiNotificationPayload(
  payload: NotificationKanjiCardPayload,
): DeserializedKanjiNotificationPayload {
  const parse = <T>(json: unknown, fallback: T): T => {
    if (typeof json !== "string") return fallback;
    try {
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  };
  return {
    meaning: parse(payload.meaning, []),
    meaningKorean: parse(payload.meaningKorean, []),
    meaningKoreanRomanize: parse(payload.meaningKoreanRomanize, []),
    reading: parse(payload.reading, []),
    readingKorean: parse(payload.readingKorean, []),
    readingKoreanRomanize: parse(payload.readingKoreanRomanize, []),
    meaningExample: parse(payload.meaningExample, []),
    meaningExampleHurigana: parse(payload.meaningExampleHurigana, []),
    meaningEnglishTranslation: parse(payload.meaningEnglishTranslation, []),
    meaningKoreanTranslation: parse(payload.meaningKoreanTranslation, []),
    readingExample: parse(payload.readingExample, []),
    readingExampleHurigana: parse(payload.readingExampleHurigana, []),
    readingEnglishTranslation: parse(payload.readingEnglishTranslation, []),
    readingKoreanTranslation: parse(payload.readingKoreanTranslation, []),
    example: parse(payload.example, []),
    exampleHurigana: parse(payload.exampleHurigana, []),
    exampleEnglishTranslation: parse(payload.exampleEnglishTranslation, []),
    exampleKoreanTranslation: parse(payload.exampleKoreanTranslation, []),
  };
}

export type NotificationCardPayload =
  NotificationCollocationCardPayload | NotificationKanjiCardPayload;

const isStringOrUndefined = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === "string";

const isStringArrayOrUndefined = (
  value: unknown,
): value is string[] | undefined =>
  value === undefined ||
  (Array.isArray(value) && value.every((entry) => typeof entry === "string"));

export const isNotificationCardPayload = (
  value: unknown,
): value is NotificationCardPayload => {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;

  if (data.type !== "pop_word") return false;
  if (
    data.cardKind !== "collocation" &&
    data.cardKind !== "kanji"
  )
    return false;
  if (typeof data.course !== "string") return false;

  if (data.cardKind === "kanji") {
    return typeof data.kanji === "string";
  }

  if (typeof data.word !== "string" || typeof data.meaning !== "string") {
    return false;
  }

  if (!isStringOrUndefined(data.id)) return false;
  if (!isStringOrUndefined(data.pronunciation)) return false;
  if (!isStringOrUndefined(data.pronunciationRoman)) return false;
  if (!isStringOrUndefined(data.example)) return false;
  if (!isStringOrUndefined(data.exampleFurigana)) return false;
  if (!isStringOrUndefined(data.translation)) return false;
  if (!isStringArrayOrUndefined(data.synonyms)) return false;
  if (!isStringOrUndefined(data.imageUrl)) return false;
  if (data.localized !== undefined) {
    if (typeof data.localized === "string") {
      try {
        data.localized = JSON.parse(data.localized);
      } catch {
        return false;
      }
    }
    
    if (typeof data.localized !== "object" || data.localized === null) {
      return false;
    }
  }

  return true;
};
