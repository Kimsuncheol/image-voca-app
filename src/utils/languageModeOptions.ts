import { Ionicons } from "@expo/vector-icons";
import { setLanguageMode, type LanguageMode } from "../i18n";
import {
  getStudyReminderEnabledPreference,
  scheduleDailyNotifications,
} from "./notifications";

type Translate = (key: string, options?: { defaultValue?: string }) => string;

export type LanguageModeOption = {
  mode: LanguageMode;
  label: string;
} & (
  | { icon: keyof typeof Ionicons.glyphMap; flag?: never }
  | { flag: string; icon?: never }
);

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

export const changeLanguageModeWithSideEffects = async (
  nextMode: LanguageMode,
) => {
  await setLanguageMode(nextMode);

  if (await getStudyReminderEnabledPreference()) {
    await scheduleDailyNotifications();
  }
};
