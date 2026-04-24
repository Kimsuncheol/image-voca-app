import { render } from "@testing-library/react-native";
import React from "react";
import { KanjiWordBankCard } from "../components/wordbank/KanjiWordBankCard";
import type { SavedWord } from "../components/wordbank/WordCard";

jest.mock("../src/hooks/useCardSpeechCleanup", () => ({
  useCardSpeechCleanup: jest.fn(),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: "en",
    },
  }),
}));

jest.mock("../components/common/DayBadge", () => ({
  DayBadge: ({ day }: { day: number }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{`Day ${day}`}</Text>;
  },
}));

jest.mock("../components/wordbank/AddToWordBankButton", () => ({
  AddToWordBankButton: () => null,
}));

const buildSavedKanjiWord = (
  overrides: Partial<SavedWord> = {},
): SavedWord => ({
  id: "kanji-1",
  kanji: "語",
  meaning: ["word"],
  meaningKorean: ["단어"],
  meaningKoreanRomanize: ["dan-eo"],
  meaningExample: [{ items: ["熟語"] }],
  meaningExampleHurigana: [{ items: ["じゅくご"] }],
  meaningEnglishTranslation: [{ items: ["compound word"] }],
  meaningKoreanTranslation: [{ items: ["숙어"] }],
  reading: ["ご"],
  readingKorean: ["고"],
  readingKoreanRomanize: ["go"],
  readingExample: [{ items: ["日本語"] }],
  readingExampleHurigana: [{ items: ["にほんご"] }],
  readingEnglishTranslation: [{ items: ["Japanese language"] }],
  readingKoreanTranslation: [{ items: ["일본어"] }],
  example: ["語を学ぶ。"],
  exampleEnglishTranslation: ["Learn words."],
  exampleKoreanTranslation: ["단어를 배우다."],
  exampleHurigana: ["ごをまなぶ。"],
  course: "KANJI",
  addedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("KanjiWordBankCard", () => {
  it("renders combined meaning and reading rows for saved Kanji words", () => {
    const screen = render(
      <KanjiWordBankCard word={buildSavedKanjiWord()} isDark={false} />,
    );

    expect(screen.getByText("dan-eo")).toBeTruthy();
    expect(screen.getByText("word")).toBeTruthy();
    expect(screen.getByText("go")).toBeTruthy();
    expect(screen.getByText("ご")).toBeTruthy();
  });

  it("omits missing combined row parts without dangling separators", () => {
    const screen = render(
      <KanjiWordBankCard
        word={buildSavedKanjiWord({
          meaning: ["word", "language", ""],
          meaningKorean: ["단어", "", "뜻"],
          meaningKoreanRomanize: ["", "eon-eo", "tteut"],
          reading: ["ご", ""],
          readingKorean: ["고", "음"],
          readingKoreanRomanize: ["", "eum"],
        })}
        isDark={false}
      />,
    );

    expect(screen.getByText("word")).toBeTruthy();
    expect(screen.getByText("eon-eo")).toBeTruthy();
    expect(screen.getByText("language")).toBeTruthy();
    expect(screen.getByText("tteut")).toBeTruthy();
    expect(screen.getByText("ご")).toBeTruthy();
    expect(screen.getByText("eum")).toBeTruthy();
  });
});
