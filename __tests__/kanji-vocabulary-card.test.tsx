import { render } from "@testing-library/react-native";
import React from "react";
import { KanjiVocabularyCard } from "../components/course/vocabulary/KanjiVocabularyCard";
import type { KanjiWord } from "../src/types/vocabulary";

let mockLanguage = "en";
const mockSpeak = jest.fn();

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: mockLanguage },
  }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    isSpeaking: false,
    isPaused: false,
    error: null,
  }),
}));

jest.mock("../components/swipe/SwipeCardItemImageSection", () => ({
  __esModule: true,
  SwipeCardItemImageSection: ({
    testID,
    topRightOverlay,
  }: {
    testID?: string;
    topRightOverlay?: React.ReactNode;
  }) => {
    const { Text: MockText, View: MockView } = require("react-native");
    return (
      <MockView testID={testID ?? "mock-image-section"}>
        <MockText>placeholder</MockText>
        {topRightOverlay}
      </MockView>
    );
  },
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => null,
}));

function buildKanjiWord(overrides: Partial<KanjiWord> = {}): KanjiWord {
  return {
    id: "kanji-1",
    kanji: "語",
    meaning: ["word"],
    meaningExample: [{ items: ["熟語"] }],
    meaningExampleHurigana: [{ items: ["じゅくご"] }],
    meaningEnglishTranslation: [{ items: ["compound word"] }],
    meaningKoreanTranslation: [{ items: ["숙어"] }],
    reading: ["ご"],
    readingExample: [{ items: ["日本語"] }],
    readingExampleHurigana: [{ items: ["にほんご"] }],
    readingEnglishTranslation: [{ items: ["Japanese language"] }],
    readingKoreanTranslation: [{ items: ["일본어"] }],
    example: ["語を学ぶ。"],
    exampleEnglishTranslation: ["Learn words."],
    exampleKoreanTranslation: ["단어를 배우다."],
    exampleHurigana: ["ごをまなぶ。"],
    ...overrides,
  };
}

describe("KanjiVocabularyCard", () => {
  beforeEach(() => {
    mockLanguage = "en";
    mockSpeak.mockClear();
  });

  it("renders meaning, reading, and general example groups by index", () => {
    const { getByText, getByTestId } = render(
      <KanjiVocabularyCard item={buildKanjiWord()} day={1} />,
    );

    expect(getByTestId("kanji-card-image-shell")).toBeTruthy();
    expect(getByTestId("kanji-card-info-scroll")).toBeTruthy();
    expect(getByText("語")).toBeTruthy();
    expect(getByText("word")).toBeTruthy();
    expect(getByText("熟語")).toBeTruthy();
    expect(getByText("じゅくご")).toBeTruthy();
    expect(getByText("compound word")).toBeTruthy();
    expect(getByText("ご")).toBeTruthy();
    expect(getByText("日本語")).toBeTruthy();
    expect(getByText("にほんご")).toBeTruthy();
    expect(getByText("Japanese language")).toBeTruthy();
    expect(getByText("語を学ぶ。")).toBeTruthy();
    expect(getByText("ごをまなぶ。")).toBeTruthy();
    expect(getByText("Learn words.")).toBeTruthy();
  });

  it("uses Korean translation arrays when the UI language is Korean", () => {
    mockLanguage = "ko";

    const { getByText, queryByText } = render(
      <KanjiVocabularyCard item={buildKanjiWord()} />,
    );

    expect(getByText("숙어")).toBeTruthy();
    expect(getByText("일본어")).toBeTruthy();
    expect(getByText("단어를 배우다.")).toBeTruthy();
    expect(queryByText("compound word")).toBeNull();
    expect(queryByText("Japanese language")).toBeNull();
    expect(queryByText("Learn words.")).toBeNull();
  });

  it("does not crash when grouped arrays are shorter than simple arrays", () => {
    const { getByText, queryByText } = render(
      <KanjiVocabularyCard
        item={buildKanjiWord({
          meaning: ["word", "language"],
          meaningExample: [{ items: ["熟語"] }],
          meaningExampleHurigana: [],
          meaningEnglishTranslation: [],
          reading: ["ご", "かたる"],
          readingExample: [],
          readingExampleHurigana: [],
          readingEnglishTranslation: [],
          example: ["語る。"],
          exampleHurigana: [],
          exampleEnglishTranslation: [],
        })}
      />,
    );

    expect(getByText("language")).toBeTruthy();
    expect(getByText("かたる")).toBeTruthy();
    expect(getByText("語る。")).toBeTruthy();
    expect(queryByText("undefined")).toBeNull();
  });
});
