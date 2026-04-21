import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { KanjiCollocationCard } from "../components/course/vocabulary/KanjiCollocationCard";
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

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => null,
}));

jest.mock("react-native-flip-card", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({
    children,
    flip,
  }: {
    children: React.ReactNode;
    flip?: boolean;
  }) => {
    const sides = React.Children.toArray(children);
    return <View>{sides[flip ? 1 : 0]}</View>;
  };
});

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

const flipToBack = (screen: ReturnType<typeof render>) => {
  fireEvent.press(screen.getByTestId("kanji-collocation-face-side"));
};

const textChildrenOf = (node: { findAllByType: (type: unknown) => Array<{ props: { children?: unknown } }> }) =>
  node
    .findAllByType(Text)
    .flatMap((textNode) => React.Children.toArray(textNode.props.children))
    .filter((child): child is string => typeof child === "string");

describe("KanjiCollocationCard", () => {
  beforeEach(() => {
    mockLanguage = "en";
    mockSpeak.mockClear();
  });

  it("renders kanji, meaning values, and reading values on face side", () => {
    const { getByText, getAllByText, queryByText } = render(<KanjiCollocationCard item={buildKanjiWord()} day={1} />);

    expect(getByText("語")).toBeTruthy();
    expect(getAllByText("word").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("ご").length).toBeGreaterThanOrEqual(1);
    expect(queryByText("熟語")).toBeNull();
  });

  it("renders example text and translation on back side", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    const { getByText } = screen;

    expect(getByText("熟語")).toBeTruthy();
    expect(getByText("compound word")).toBeTruthy();
    expect(getByText("日本語")).toBeTruthy();
    expect(getByText("Japanese language")).toBeTruthy();
    expect(getByText("語を学ぶ。")).toBeTruthy();
    expect(getByText("Learn words.")).toBeTruthy();
  });

  it("does not render hurigana text visually", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    const { queryByText } = screen;

    expect(queryByText("じゅくご")).toBeNull();
    expect(queryByText("にほんご")).toBeNull();
    expect(queryByText("ごをまなぶ。")).toBeNull();
  });

  it("uses Korean translations when language is ko", () => {
    mockLanguage = "ko";

    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    const { getByText, queryByText } = screen;

    expect(getByText("숙어")).toBeTruthy();
    expect(getByText("일본어")).toBeTruthy();
    expect(getByText("단어를 배우다.")).toBeTruthy();
    expect(queryByText("compound word")).toBeNull();
    expect(queryByText("Japanese language")).toBeNull();
    expect(queryByText("Learn words.")).toBeNull();
  });

  it("does not crash when grouped arrays are shorter than value arrays", () => {
    const screen = render(
      <KanjiCollocationCard
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
    flipToBack(screen);
    const { getAllByText, getByText, queryByText } = screen;

    expect(getAllByText("language").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("かたる").length).toBeGreaterThanOrEqual(1);
    expect(getByText("語る。")).toBeTruthy();
    expect(queryByText("undefined")).toBeNull();
  });

  it("がな button toggles furigana visibility", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          example: ["語(ご)を学(まな)ぶ。"],
        })}
      />,
    );
    flipToBack(screen);
    const { queryByText, getByText, getByTestId } = screen;

    expect(queryByText("じゅくご")).toBeNull();
    expect(queryByText("にほんご")).toBeNull();
    expect(queryByText("ごをまなぶ。")).toBeNull();
    expect(getByText("語を学ぶ。")).toBeTruthy();
    expect(queryByText("(ご)")).toBeNull();

    fireEvent.press(getByText("がな"));

    expect(getByTestId("kanji-collocation-back-side")).toBeTruthy();
    expect(getByText("じゅくご")).toBeTruthy();
    expect(getByText("にほんご")).toBeTruthy();
    expect(queryByText("ごをまなぶ。")).toBeNull();
    expect(getByText("(ご)")).toBeTruthy();
    expect(getByText("(まな)")).toBeTruthy();

    fireEvent.press(getByText("がな"));

    expect(queryByText("じゅくご")).toBeNull();
    expect(queryByText("(ご)")).toBeNull();
  });

  it("renders meaning and reading hurigana at font size 8 when がな is active", () => {
    const screen = render(
      <KanjiCollocationCard item={buildKanjiWord()} />,
    );
    flipToBack(screen);
    const { getByText, getByTestId } = screen;

    fireEvent.press(getByText("がな"));

    expect(
      StyleSheet.flatten(
        getByTestId("kanji-collocation-meaning-hurigana-0-0").props.style,
      ).fontSize,
    ).toBe(8);
    expect(
      StyleSheet.flatten(
        getByTestId("kanji-collocation-reading-hurigana-0-0").props.style,
      ).fontSize,
    ).toBe(8);
  });

  it("lays out meaning and reading example rows above their hurigana rows", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    const meaningMainRow = screen.getByTestId(
      "kanji-collocation-meaning-main-row-0-0",
    );
    const readingMainRow = screen.getByTestId(
      "kanji-collocation-reading-main-row-0-0",
    );

    expect(textChildrenOf(meaningMainRow)).toEqual(
      expect.arrayContaining(["熟語", "compound word"]),
    );
    expect(textChildrenOf(readingMainRow)).toEqual(
      expect.arrayContaining(["日本語", "Japanese language"]),
    );
    expect(
      screen.queryByTestId("kanji-collocation-meaning-hurigana-0-0"),
    ).toBeNull();
    expect(
      screen.queryByTestId("kanji-collocation-reading-hurigana-0-0"),
    ).toBeNull();

    fireEvent.press(screen.getByText("がな"));

    expect(
      screen.getByTestId("kanji-collocation-meaning-hurigana-0-0").props
        .children,
    ).toBe("じゅくご");
    expect(
      screen.getByTestId("kanji-collocation-reading-hurigana-0-0").props
        .children,
    ).toBe("にほんご");
  });

  it("does not duplicate the example when example and exampleHurigana match", () => {
    const matchingExample = "語を学ぶ。";
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          example: [matchingExample],
          exampleHurigana: [matchingExample],
        })}
      />,
    );
    flipToBack(screen);
    const { getByText, getAllByText, queryByText } = screen;

    expect(getAllByText(matchingExample)).toHaveLength(1);

    fireEvent.press(getByText("がな"));

    expect(getAllByText(matchingExample)).toHaveLength(1);
    expect(queryByText("ごをまなぶ。")).toBeNull();
  });

  it("toggles parenthetical kana in examples like the JLPT がな feature", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          kanji: "一",
          example: [
            "一(いち)月(がつ)新(あたら)しい一(いち)年(ねん)の始(はじ)まりだ。",
          ],
          exampleHurigana: [
            "いちがつあたらしいいちねんのはじまりだ。",
          ],
          exampleEnglishTranslation: ["January is the beginning of a new year."],
        })}
      />,
    );
    flipToBack(screen);
    const { getByText, getAllByText, getByTestId, queryByText } = screen;

    expect(getByText("一月新しい一年の始まりだ。")).toBeTruthy();
    expect(queryByText("(いち)")).toBeNull();
    expect(
      queryByText(
        "一(いち)月(がつ)新(あたら)しい一(いち)年(ねん)の始(はじ)まりだ。",
      ),
    ).toBeNull();

    fireEvent.press(getByText("がな"));

    expect(getAllByText("(いち)").length).toBeGreaterThanOrEqual(1);
    expect(getByText("(がつ)")).toBeTruthy();
    expect(
      StyleSheet.flatten(
        getByTestId("kanji-collocation-example-furigana-segment-0-1").props
          .style,
      ).fontSize,
    ).toBe(12);
  });

  it("uses exampleHurigana for Japanese TTS when available", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    const { getByText, getByTestId } = screen;

    fireEvent.press(getByText("語を学ぶ。"));

    expect(mockSpeak).toHaveBeenCalledWith("ごをまなぶ。", {
      language: "ja-JP",
    });
    expect(getByTestId("kanji-collocation-back-side")).toBeTruthy();
  });

  it("flips from the face side to the back side", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);

    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();

    flipToBack(screen);

    expect(screen.getByTestId("kanji-collocation-back-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-face-side")).toBeNull();
  });

  it("flips back to the face side when the back side background is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    fireEvent.press(screen.getByTestId("kanji-collocation-back-side"));

    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when the back scroll background is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    fireEvent.press(screen.getByTestId("kanji-collocation-back-scroll-background"));

    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });
});
