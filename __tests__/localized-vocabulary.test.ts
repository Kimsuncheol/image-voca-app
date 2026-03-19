import {
  normalizeVocabularyLocalizationMap,
  resolveQuizVocabulary,
  resolveVocabularyContent,
} from "../src/utils/localizedVocabulary";

describe("localizedVocabulary", () => {
  it("resolves Korean localized content when available", () => {
    const resolved = resolveVocabularyContent(
      {
        word: "abandon",
        meaning: "leave behind",
        translation: "버리다",
        pronunciation: "/əˈbæn.dən/",
        pronunciationRoman: "eo-baen-deon",
        example: "They abandoned the plan.",
        localized: {
          en: {
            meaning: "leave behind",
            translation: "to give up",
            pronunciation: "uh-BAN-duhn",
          },
          ko: {
            meaning: "버리다",
            translation: "포기하다",
            pronunciation: "어밴던",
          },
        },
      },
      "ko",
    );

    expect(resolved.language).toBe("ko");
    expect(resolved.meaning).toBe("버리다");
    expect(resolved.translation).toBe("포기하다");
    expect(resolved.sharedPronunciation).toBe("/əˈbæn.dən/");
    expect(resolved.localizedPronunciation).toBe("어밴던");
    expect(resolved.pronunciationRoman).toBe("eo-baen-deon");
  });

  it("falls back Japanese requests to English localized content", () => {
    const resolved = resolveVocabularyContent(
      {
        word: "adapt",
        meaning: "adjust",
        example: "Adapt quickly.",
        localized: {
          en: {
            meaning: "adjust",
            translation: "to change",
            pronunciation: "uh-DAPT",
          },
          ko: {
            meaning: "적응하다",
          },
        },
      },
      "ja",
    );

    expect(resolved.language).toBe("en");
    expect(resolved.meaning).toBe("adjust");
    expect(resolved.translation).toBe("to change");
    expect(resolved.localizedPronunciation).toBe("uh-DAPT");
  });

  it("resolves Korean JLPT flat fields for quiz vocabulary", () => {
    const resolved = resolveQuizVocabulary(
      {
        word: "間",
        meaningEnglish: "between",
        meaningKorean: "사이",
        pronunciation: "あいだ",
        pronunciationRoman: "aida",
      },
      "ko",
    );

    expect(resolved.language).toBe("ko");
    expect(resolved.meaning).toBe("사이");
    expect(resolved.pronunciation).toBe("あいだ");
    expect(resolved.pronunciationRoman).toBe("aida");
  });

  it("resolves English JLPT flat fields for quiz vocabulary", () => {
    const resolved = resolveQuizVocabulary(
      {
        word: "間",
        meaningEnglish: "between",
        meaningKorean: "사이",
        pronunciation: "あいだ",
        pronunciationRoman: "aida",
      },
      "en",
    );

    expect(resolved.language).toBe("en");
    expect(resolved.meaning).toBe("between");
    expect(resolved.pronunciation).toBe("あいだ");
    expect(resolved.pronunciationRoman).toBe("aida");
  });

  it("falls back Japanese quiz requests to English flat fields", () => {
    const resolved = resolveQuizVocabulary(
      {
        word: "間",
        meaningEnglish: "between",
        meaningKorean: "사이",
        pronunciation: "あいだ",
        pronunciationRoman: "aida",
      },
      "ja",
    );

    expect(resolved.language).toBe("en");
    expect(resolved.meaning).toBe("between");
    expect(resolved.pronunciation).toBe("あいだ");
    expect(resolved.pronunciationRoman).toBe("aida");
  });

  it("falls back to legacy flat fields when localized content is missing", () => {
    const resolved = resolveVocabularyContent(
      {
        word: "retain",
        meaning: "to keep",
        translation: "유지하다",
        pronunciation: "/rɪˈteɪn/",
        example: "Retain the receipt.",
      },
      "ko",
    );

    expect(resolved.meaning).toBe("to keep");
    expect(resolved.translation).toBe("유지하다");
    expect(resolved.localizedPronunciation).toBe("/rɪˈteɪn/");
  });

  it("normalizes localization maps and drops empty blocks", () => {
    expect(
      normalizeVocabularyLocalizationMap({
        en: {
          meaning: " adjust ",
          translation: " to change ",
        },
        ko: {
          meaning: "   ",
        },
      }),
    ).toEqual({
      en: {
        meaning: "adjust",
        translation: "to change",
      },
    });
  });
});
