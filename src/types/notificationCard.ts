import type {
  CourseType,
  VocabularyLocalizationMap,
} from "./vocabulary";

export type NotificationCardKind = "word" | "collocation";

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
  translation?: string;
  imageUrl?: string;
  localized?: VocabularyLocalizationMap;
}

export interface NotificationWordCardPayload extends NotificationCardPayloadBase {
  cardKind: "word";
}

export interface NotificationCollocationCardPayload
  extends NotificationCardPayloadBase {
  cardKind: "collocation";
}

export type NotificationCardPayload =
  | NotificationWordCardPayload
  | NotificationCollocationCardPayload;

const isStringOrUndefined = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === "string";

export const isNotificationCardPayload = (
  value: unknown,
): value is NotificationCardPayload => {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;

  if (data.type !== "pop_word") return false;
  if (data.cardKind !== "word" && data.cardKind !== "collocation") return false;
  if (typeof data.course !== "string") return false;
  if (typeof data.word !== "string" || typeof data.meaning !== "string") {
    return false;
  }

  if (!isStringOrUndefined(data.id)) return false;
  if (!isStringOrUndefined(data.pronunciation)) return false;
  if (!isStringOrUndefined(data.pronunciationRoman)) return false;
  if (!isStringOrUndefined(data.example)) return false;
  if (!isStringOrUndefined(data.translation)) return false;
  if (!isStringOrUndefined(data.imageUrl)) return false;
  if (
    data.localized !== undefined &&
    (typeof data.localized !== "object" || data.localized === null)
  ) {
    return false;
  }

  return true;
};
