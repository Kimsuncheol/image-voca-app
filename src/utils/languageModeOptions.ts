import { Ionicons } from "@expo/vector-icons";
import type { LanguageMode } from "../stores/languageSettingsStore";

type Translate = (key: string, options?: { defaultValue?: string }) => string;

export type LanguageModeOption = {
  mode: LanguageMode;
  label: string;
} & (
  | { icon: keyof typeof Ionicons.glyphMap; flag?: never }
  | { flag: string; icon?: never }
);

const ENGLISH_MODE_FLAGS: Partial<Record<LanguageMode, string>> = {
  "en-US": "🇺🇸",
  "en-GB": "🇬🇧",
  "en-AU": "🇦🇺",
  "en-NZ": "🇳🇿",
  "en-IE": "🇮🇪",
  "en-CA": "🇨🇦",
};

export const getLanguageModeOptions = (t: Translate): LanguageModeOption[] => [
  {
    mode: "system",
    label: t("settings.language.systemDefault", {
      defaultValue: "System Default",
    }),
    icon: "phone-portrait-outline",
  },
  {
    mode: "en-US",
    label: t("settings.language.englishUnitedStates", {
      defaultValue: "English (United States)",
    }),
    flag: "🇺🇸",
  },
  {
    mode: "en-GB",
    label: t("settings.language.englishUnitedKingdom", {
      defaultValue: "English (United Kingdom)",
    }),
    flag: "🇬🇧",
  },
  {
    mode: "en-AU",
    label: t("settings.language.englishAustralia", {
      defaultValue: "English (Australia)",
    }),
    flag: "🇦🇺",
  },
  {
    mode: "en-NZ",
    label: t("settings.language.englishNewZealand", {
      defaultValue: "English (New Zealand)",
    }),
    flag: "🇳🇿",
  },
  {
    mode: "en-IE",
    label: t("settings.language.englishIreland", {
      defaultValue: "English (Ireland)",
    }),
    flag: "🇮🇪",
  },
  {
    mode: "en-CA",
    label: t("settings.language.englishCanada", {
      defaultValue: "English (Canada)",
    }),
    flag: "🇨🇦",
  },
  {
    mode: "ko",
    label: t("settings.language.korean", { defaultValue: "Korean" }),
    flag: "🇰🇷",
  },
  {
    mode: "ja",
    label: t("settings.language.japanese", { defaultValue: "Japanese" }),
    flag: "🇯🇵",
  },
  {
    mode: "es",
    label: t("settings.language.spanish", { defaultValue: "Spanish" }),
    flag: "🇪🇸",
  },
  {
    mode: "fr",
    label: t("settings.language.french", { defaultValue: "French" }),
    flag: "🇫🇷",
  },
  {
    mode: "ru",
    label: t("settings.language.russian", { defaultValue: "Russian" }),
    flag: "🇷🇺",
  },
  {
    mode: "de",
    label: t("settings.language.german", { defaultValue: "German" }),
    flag: "🇩🇪",
  },
  {
    mode: "it",
    label: t("settings.language.italian", { defaultValue: "Italian" }),
    flag: "🇮🇹",
  },
  {
    mode: "hi",
    label: t("settings.language.hindi", { defaultValue: "Hindi" }),
    flag: "🇮🇳",
  },
];

export const getLanguageModeSummary = (
  option: LanguageModeOption,
  t: Translate,
) => {
  const englishFlag = ENGLISH_MODE_FLAGS[option.mode];
  if (englishFlag) {
    return `${t("settings.language.english", {
      defaultValue: "English",
    })} ${englishFlag}`;
  }

  if (option.flag) {
    return `${option.label} ${option.flag}`;
  }

  return option.label;
};

export const changeLanguageModeWithSideEffects = async (
  nextMode: LanguageMode,
) => {
  const { setLanguageMode } = require("../i18n") as typeof import("../i18n");
  const {
    getStudyReminderEnabledPreference,
    scheduleDailyNotifications,
  } = require("./notifications") as typeof import("./notifications");

  await setLanguageMode(nextMode);

  if (await getStudyReminderEnabledPreference()) {
    await scheduleDailyNotifications();
  }
};
