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
      systemLanguage: "en-US",
      effectiveLanguage: "en-US",
      nationality: {
        isKorean: false,
        regionCode: null,
        languageTag: null,
        recommendedStudyPack: null,
      },
      _initialized: false,
    });
    await i18n.changeLanguage("en-US");
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
    expect(resolveSystemLanguage([makeLocale("en-US", "en", "US")])).toBe(
      "en-US",
    );
    expect(resolveSystemLanguage([makeLocale("en-GB", "en", "GB")])).toBe(
      "en-GB",
    );
    expect(resolveSystemLanguage([makeLocale("en-AU", "en", "AU")])).toBe(
      "en-AU",
    );
    expect(resolveSystemLanguage([makeLocale("en-NZ", "en", "NZ")])).toBe(
      "en-NZ",
    );
    expect(resolveSystemLanguage([makeLocale("en-IE", "en", "IE")])).toBe(
      "en-IE",
    );
    expect(resolveSystemLanguage([makeLocale("en-CA", "en", "CA")])).toBe(
      "en-CA",
    );
    expect(resolveSystemLanguage([makeLocale("en-ZA", "en", "ZA")])).toBe(
      "en-US",
    );
    expect(resolveSystemLanguage([makeLocale("en", "en", null)])).toBe(
      "en-US",
    );
    expect(resolveSystemLanguage([makeLocale("ja-JP", "ja", "JP")])).toBe(
      "ja",
    );
    expect(resolveSystemLanguage([makeLocale("fr-FR", "fr", "FR")])).toBe(
      "fr",
    );
    expect(resolveSystemLanguage([makeLocale("es-ES", "es", "ES")])).toBe(
      "es",
    );
    expect(resolveSystemLanguage([makeLocale("ru-RU", "ru", "RU")])).toBe(
      "ru",
    );
    expect(resolveSystemLanguage([makeLocale("de-DE", "de", "DE")])).toBe(
      "de",
    );
    expect(resolveSystemLanguage([makeLocale("it-IT", "it", "IT")])).toBe(
      "it",
    );
    expect(resolveSystemLanguage([makeLocale("hi-IN", "hi", "IN")])).toBe(
      "hi",
    );
    expect(resolveSystemLanguage([makeLocale("pt-BR", "pt", "BR")])).toBe(
      "en-US",
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
    expect(state.effectiveLanguage).toBe("en-US");
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

  it("migrates legacy English storage to US English", async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "en");

    await hydrateLanguage();

    const state = useLanguageSettingsStore.getState();
    expect(state.mode).toBe("en-US");
    expect(state.effectiveLanguage).toBe("en-US");
    expect(i18n.language).toBe("en-US");
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
