import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { KanjiWordBankCard } from "../components/wordbank/KanjiWordBankCard";
import type { SavedWord } from "../components/wordbank/WordCard";
import {
  __resetJapaneseContentLanguageStoreForTests,
  useJapaneseContentLanguageStore,
} from "../src/stores/japaneseContentLanguageStore";

const mockHandleSpeech = jest.fn();

jest.mock("../src/hooks/useCardSpeechCleanup", () => ({
  useCardSpeechCleanup: jest.fn(),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: jest.fn(),
  }),
}));

jest.mock("../src/hooks/useStudyMode", () => ({
  useStudySpeech: () => ({
    handleSpeech: mockHandleSpeech,
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
  beforeEach(() => {
    jest.clearAllMocks();
    __resetJapaneseContentLanguageStoreForTests();
    useJapaneseContentLanguageStore.setState({ _initialized: true });
  });

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

  it("renders the day badge before the image in the header", () => {
    const screen = render(
      <KanjiWordBankCard
        word={buildSavedKanjiWord({
          day: 7,
          imageUrl: "https://cdn.example.com/kanji.jpg",
        })}
        isDark={false}
      />,
    );

    const headerRight = screen.getByTestId("kanji-word-bank-header-right");
    const childTestIds = headerRight.props.children
      .filter(Boolean)
      .map((child: { props?: { testID?: string } }) => child.props?.testID);

    expect(childTestIds).toEqual([
      "kanji-word-bank-day-badge",
      "kanji-word-bank-image-container",
    ]);
    expect(screen.getByText("Day 7")).toBeTruthy();
  });

  it("masks saved Kanji word text when the word target is active", () => {
    const screen = render(
      <KanjiWordBankCard
        word={buildSavedKanjiWord()}
        isDark={false}
        isReviewMode
        reviewMaskTarget="word"
      />,
    );

    expect(screen.getByText("語")).toHaveStyle({
      color: "#F8FAFC",
    });
  });

  it("masks saved Kanji word text with the dark card background in dark mode", () => {
    const screen = render(
      <KanjiWordBankCard
        word={buildSavedKanjiWord()}
        isDark
        isReviewMode
        reviewMaskTarget="word"
      />,
    );

    expect(screen.getByText("語")).toHaveStyle({
      color: "#050505",
    });
  });

  it("masks saved Kanji general examples when the example target is active", () => {
    const screen = render(
      <KanjiWordBankCard
        word={buildSavedKanjiWord()}
        isDark={false}
        isReviewMode
        reviewMaskTarget="example"
      />,
    );

    expect(
      screen.getByTestId("kanji-collocation-example-visible-0"),
    ).toHaveStyle({
      color: "#F8FAFC",
    });
  });

  it("masks saved Kanji general examples with the dark card background in dark mode", () => {
    const screen = render(
      <KanjiWordBankCard
        word={buildSavedKanjiWord()}
        isDark
        isReviewMode
        reviewMaskTarget="example"
      />,
    );

    expect(
      screen.getByTestId("kanji-collocation-example-visible-0"),
    ).toHaveStyle({
      color: "#050505",
    });
  });

  it("masks saved Kanji general examples when the all target is active", () => {
    const screen = render(
      <KanjiWordBankCard
        word={buildSavedKanjiWord()}
        isDark={false}
        isReviewMode
        reviewMaskTarget="all"
      />,
    );

    expect(
      screen.getByTestId("kanji-collocation-example-visible-0"),
    ).toHaveStyle({
      color: "#F8FAFC",
    });
  });

  it("does not speak the Kanji glyph when it is pressed", () => {
    const screen = render(
      <KanjiWordBankCard word={buildSavedKanjiWord()} isDark={false} />,
    );

    fireEvent.press(screen.getByText("語"));

    expect(mockHandleSpeech).not.toHaveBeenCalled();
  });

  it("speaks meaning row base text in Japanese", () => {
    const screen = render(
      <KanjiWordBankCard word={buildSavedKanjiWord()} isDark={false} />,
    );

    fireEvent.press(screen.getByTestId("kanji-word-bank-meaning-row-0"));

    expect(mockHandleSpeech).toHaveBeenCalledWith("word", "JP");
  });

  it("speaks reading row base text in Japanese", () => {
    const screen = render(
      <KanjiWordBankCard word={buildSavedKanjiWord()} isDark={false} />,
    );

    fireEvent.press(screen.getByTestId("kanji-word-bank-reading-row-0"));

    expect(mockHandleSpeech).toHaveBeenCalledWith("ご", "JP");
  });

  it("uses English example translations by default when UI language is English", () => {
    const screen = render(
      <KanjiWordBankCard word={buildSavedKanjiWord()} isDark={false} />,
    );

    expect(screen.getByText("Learn words.")).toBeTruthy();
    expect(screen.queryByText("단어를 배우다.")).toBeNull();
  });

  it("uses Korean example translations when Japanese-in-Korean content is enabled", () => {
    useJapaneseContentLanguageStore.setState({
      mode: "ko",
      _initialized: true,
    });

    const screen = render(
      <KanjiWordBankCard word={buildSavedKanjiWord()} isDark={false} />,
    );

    expect(screen.getByText("단어를 배우다.")).toBeTruthy();
    expect(screen.queryByText("Learn words.")).toBeNull();
  });
});
