import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import type { Locale } from "expo-localization";
import i18n, {
  LANGUAGE_STORAGE_KEY,
  hydrateLanguage,
  setLanguage,
  setLanguageMode,
  syncLanguageWithSystemLocales,
} from "../src/i18n";
import {
  LANGUAGE_SETTINGS_STORAGE_KEY,
  buildLanguageSettingsSnapshot,
  detectNationality,
  resolveSystemLanguage,
  useLanguageSettingsStore,
} from "../src/stores/languageSettingsStore";

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [
    { languageTag: "en-US", languageCode: "en", regionCode: "US" },
  ]),
}));

const makeLocale = (
  languageTag: string,
  languageCode: string | null,
  regionCode: string | null,
) =>
  ({
    languageTag,
    languageCode,
    regionCode,
  }) as Locale;

const mockGetLocales = Localization.getLocales as jest.MockedFunction<
  typeof Localization.getLocales
>;

describe("language settings store", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetLocales.mockReturnValue([makeLocale("en-US", "en", "US")]);
    await AsyncStorage.clear();
    useLanguageSettingsStore.setState({
      mode: "system",
      systemLanguage: "en",
      effectiveLanguage: "en",
      nationality: {
        isKorean: false,
        regionCode: null,
        languageTag: null,
        recommendedStudyPack: null,
      },
      _initialized: false,
    });
    await i18n.changeLanguage("en");
  });

  it("identifies Korean nationality from region even when language is English", () => {
    const nationality = detectNationality([
      makeLocale("en-KR", "en", "KR"),
    ]);

    expect(nationality).toEqual({
      isKorean: true,
      regionCode: "KR",
      languageTag: "en-KR",
      recommendedStudyPack: "ko-en-bilingual",
    });
  });

  it("resolves supported system languages and falls back to English", () => {
    expect(resolveSystemLanguage([makeLocale("ja-JP", "ja", "JP")])).toBe(
      "ja",
    );
    expect(resolveSystemLanguage([makeLocale("fr-FR", "fr", "FR")])).toBe(
      "en",
    );
  });

  it("builds an effective language from system mode", () => {
    expect(
      buildLanguageSettingsSnapshot("system", [
        makeLocale("ko-KR", "ko", "KR"),
      ]).effectiveLanguage,
    ).toBe("ko");
  });

  it("defaults new installs to system mode", async () => {
    await hydrateLanguage();

    const state = useLanguageSettingsStore.getState();
    expect(state.mode).toBe("system");
    expect(state.effectiveLanguage).toBe("en");
    expect(await AsyncStorage.getItem(LANGUAGE_SETTINGS_STORAGE_KEY)).toContain(
      '"mode":"system"',
    );
  });

  it("migrates a legacy stored language to a manual mode", async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "ko");

    await hydrateLanguage();

    const state = useLanguageSettingsStore.getState();
    expect(state.mode).toBe("ko");
    expect(state.effectiveLanguage).toBe("ko");
    expect(i18n.language).toBe("ko");
  });

  it("ignores system locale changes while manually locked", async () => {
    await setLanguage("ko");

    await syncLanguageWithSystemLocales([
      makeLocale("ja-JP", "ja", "JP"),
    ]);

    const state = useLanguageSettingsStore.getState();
    expect(state.mode).toBe("ko");
    expect(state.systemLanguage).toBe("ja");
    expect(state.effectiveLanguage).toBe("ko");
    expect(i18n.language).toBe("ko");
  });

  it("updates i18n when system mode sees a new supported locale", async () => {
    await setLanguageMode("system");

    await syncLanguageWithSystemLocales([
      makeLocale("ja-JP", "ja", "JP"),
    ]);

    const state = useLanguageSettingsStore.getState();
    expect(state.mode).toBe("system");
    expect(state.effectiveLanguage).toBe("ja");
    expect(i18n.language).toBe("ja");
  });
});
