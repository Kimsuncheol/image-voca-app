import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { KanjiCollocationCard } from "../components/course/vocabulary/KanjiCollocationCard";
import type { KanjiWord } from "../src/types/vocabulary";

let mockLanguage = "en";
const mockSpeak = jest.fn();
const mockStopCardSpeech = jest.fn();

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

jest.mock("../src/hooks/useCardSpeechCleanup", () => ({
  useCardSpeechCleanup: () => mockStopCardSpeech,
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => null,
}));

jest.mock("../components/common/DayBadge", () => ({
  DayBadge: ({ day }: { day: number }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{`Day ${day}`}</Text>;
  },
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
    ...overrides,
  };
}

const flipToBack = (screen: ReturnType<typeof render>) => {
  fireEvent.press(screen.getByTestId("kanji-collocation-face-side"));
};

const textChildrenOf = (node: { findAllByType: (type: unknown) => Array<{ props: { children?: unknown } }> }) =>
  node
    .findAllByType(Text)
    .flatMap((textNode) =>
      React.Children.toArray(textNode.props.children as React.ReactNode),
    )
    .filter((child): child is string => typeof child === "string");

const flattenStyleOf = (node: { props: { style?: unknown } }): any =>
  StyleSheet.flatten(node.props.style as any);

const firstTextNodeOf = (node: {
  findAllByType: (type: unknown) => Array<{ props: { style?: unknown } }>;
}) => node.findAllByType(Text)[0];

describe("KanjiCollocationCard", () => {
  beforeEach(() => {
    mockLanguage = "en";
    mockSpeak.mockClear();
    mockStopCardSpeech.mockClear();
  });

  it("renders combined meaning and reading rows on face side", () => {
    const { getByText } = render(
      <KanjiCollocationCard item={buildKanjiWord()} day={1} />,
    );

    expect(getByText("語")).toBeTruthy();
    expect(getByText("dan-eo")).toBeTruthy();
    expect(getByText("word")).toBeTruthy();
    expect(getByText("go")).toBeTruthy();
    expect(getByText("ご")).toBeTruthy();
  });

  it("renders combined rows independently of UI language", () => {
    mockLanguage = "ko";

    const { getByText } = render(
      <KanjiCollocationCard item={buildKanjiWord()} />,
    );

    expect(getByText("단어")).toBeTruthy();
    expect(getByText("word")).toBeTruthy();
    expect(getByText("고")).toBeTruthy();
    expect(getByText("ご")).toBeTruthy();
  });

  it("does not speak the kanji when the kanji text is pressed on the face side", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);

    fireEvent.press(screen.getByText("語"));

    expect(mockSpeak).not.toHaveBeenCalled();
    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-back-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-face-side")).toBeNull();
  });

  it("renders one tappable face-side row per source index", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          meaning: ["person", "one"],
          meaningKorean: ["사람", "하나"],
          meaningKoreanRomanize: ["saram", "hana"],
          reading: ["ひと", "いち"],
          readingKorean: ["히토", "이치"],
          readingKoreanRomanize: ["hito", "ichi"],
        })}
      />,
    );

    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-meaning-0")),
    ).toEqual(["saram", "person"]);
    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-meaning-1")),
    ).toEqual(["hana", "one"]);
    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-reading-0")),
    ).toEqual(["hito", "ひと"]);
    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-reading-1")),
    ).toEqual(["ichi", "いち"]);
    expect(screen.queryByTestId("kanji-collocation-face-meaning-2")).toBeNull();
    expect(screen.queryByTestId("kanji-collocation-face-reading-2")).toBeNull();

    mockSpeak.mockClear();
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-face-meaning-speak-0"));

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(mockSpeak).toHaveBeenLastCalledWith("person", {
      language: "ja-JP",
    });
    expect(mockStopCardSpeech).not.toHaveBeenCalled();
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();

    fireEvent.press(screen.getByTestId("kanji-collocation-face-reading-speak-1"));

    expect(mockSpeak).toHaveBeenCalledTimes(2);
    expect(mockSpeak).toHaveBeenLastCalledWith("いち", {
      language: "ja-JP",
    });
    expect(mockStopCardSpeech).not.toHaveBeenCalled();
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("omits missing combined row parts without dangling separators", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          meaning: ["word", "language", ""],
          meaningKorean: ["단어", "", "뜻"],
          meaningKoreanRomanize: ["", "eon-eo", "tteut"],
          reading: ["ご", ""],
          readingKorean: ["고", "음"],
          readingKoreanRomanize: ["", "eum"],
        })}
      />,
    );

    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-meaning-0")),
    ).toEqual(["word"]);
    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-meaning-1")),
    ).toEqual(["eon-eo", "language"]);
    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-meaning-2")),
    ).toEqual(["tteut"]);
    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-reading-0")),
    ).toEqual(["ご"]);
    expect(
      textChildrenOf(screen.getByTestId("kanji-collocation-face-reading-1")),
    ).toEqual(["eum"]);
  });

  it("renders example text and translation on back side", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    const { getAllByText, getByText } = screen;

    expect(getByText("熟語")).toBeTruthy();
    expect(getByText("compound word")).toBeTruthy();
    expect(getByText("日本語")).toBeTruthy();
    expect(getByText("Japanese language")).toBeTruthy();
    expect(getAllByText("語を学ぶ。").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Learn words.")).toBeTruthy();
    expect(
      screen.getByTestId("kanji-collocation-divider-meaning-reading"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("kanji-collocation-divider-reading-example"),
    ).toBeTruthy();
  });

  it("uses base meaning and reading on the back side even when UI language is en", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    expect(screen.getByText("word")).toBeTruthy();
    expect(screen.getByText("ご")).toBeTruthy();
    expect(screen.queryByText("dan-eo")).toBeNull();
    expect(screen.queryByText("go")).toBeNull();
  });

  it("uses base meaning and reading on the back side even when UI language is ko", () => {
    mockLanguage = "ko";

    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    expect(screen.getByText("word")).toBeTruthy();
    expect(screen.getByText("ご")).toBeTruthy();
    expect(screen.queryByText("단어")).toBeNull();
    expect(screen.queryByText("고")).toBeNull();
  });

  it("renders split face-side rows with respective label colors", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    const meaningTexts = screen.getByTestId("kanji-collocation-face-meaning-0").findAllByType(Text);
    const readingTexts = screen.getByTestId("kanji-collocation-face-reading-0").findAllByType(Text);

    expect(flattenStyleOf(meaningTexts[0]).color).toBe("#666");
    expect(flattenStyleOf(meaningTexts[1]).color).toBe("#1a1a1a");
    expect(flattenStyleOf(readingTexts[0]).color).toBe("#666");
    expect(flattenStyleOf(readingTexts[1]).color).toBe("#1a1a1a");
  });

  it("hides the divider above reading when the meaning section has no visible entries", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          meaning: ["", "   "],
          meaningKorean: ["", "   "],
          meaningKoreanRomanize: ["", "   "],
        })}
      />,
    );
    flipToBack(screen);

    expect(screen.queryByText("MEANING")).toBeNull();
    expect(screen.getByText("READING")).toBeTruthy();
    expect(
      screen.queryByTestId("kanji-collocation-divider-meaning-reading"),
    ).toBeNull();
    expect(
      screen.getByTestId("kanji-collocation-divider-reading-example"),
    ).toBeTruthy();
  });

  it("hides the divider below reading when the example section has no visible entries", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          example: ["", "   "],
        })}
      />,
    );
    flipToBack(screen);

    expect(screen.queryByText("EXAMPLE")).toBeNull();
    expect(
      screen.getByTestId("kanji-collocation-divider-meaning-reading"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("kanji-collocation-divider-reading-example"),
    ).toBeNull();
  });

  it("renders no dotted dividers around reading when meaning and example are both missing", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          meaning: ["", "   "],
          meaningKorean: ["", "   "],
          meaningKoreanRomanize: ["", "   "],
          example: ["", "   "],
        })}
      />,
    );
    flipToBack(screen);

    expect(screen.queryByText("MEANING")).toBeNull();
    expect(screen.getByText("READING")).toBeTruthy();
    expect(screen.queryByText("EXAMPLE")).toBeNull();
    expect(
      screen.queryByTestId("kanji-collocation-divider-meaning-reading"),
    ).toBeNull();
    expect(
      screen.queryByTestId("kanji-collocation-divider-reading-example"),
    ).toBeNull();
  });

  it("renders meaning and reading hurigana visibly by default", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    const { getByTestId, queryByText } = screen;

    const meaningHurigana = getByTestId(
      "kanji-collocation-meaning-hurigana-0-0",
    );
    const readingHurigana = getByTestId(
      "kanji-collocation-reading-hurigana-0-0",
    );

    expect(meaningHurigana.props.children).toBe("じゅくご");
    expect(readingHurigana.props.children).toBe("にほんご");
    expect(flattenStyleOf(meaningHurigana)).toEqual(
      expect.objectContaining({
        fontSize: 8,
        color: "#999",
      }),
    );
    expect(flattenStyleOf(readingHurigana)).toEqual(
      expect.objectContaining({
        fontSize: 8,
        color: "#999",
      }),
    );
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
    const { getAllByText, getByText, getByTestId, queryByText } = screen;

    expect(getAllByText("language").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("かたる").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("語る。").length).toBeGreaterThanOrEqual(1);
    const missingHuriganaPlaceholder = getByTestId(
      "kanji-collocation-meaning-hurigana-0-0",
    );
    expect(missingHuriganaPlaceholder.props.children).toBe("あ");
    expect(flattenStyleOf(missingHuriganaPlaceholder)).toEqual(
      expect.objectContaining({
        fontSize: 8,
        color: "transparent",
        backgroundColor: "transparent",
      }),
    );
    expect(queryByText("undefined")).toBeNull();
  });

  it("がな button does not change grouped meaning and reading furigana visibility", () => {
    const screen = render(
      <KanjiCollocationCard
        item={buildKanjiWord({
          example: ["語(ご)を学(まな)ぶ。"],
        })}
      />,
    );
    flipToBack(screen);
    const { getAllByText, queryByText, getByText, getByTestId } = screen;

    expect(flattenStyleOf(getByTestId("kanji-collocation-meaning-hurigana-0-0")).color).toBe("#999");
    expect(flattenStyleOf(getByTestId("kanji-collocation-reading-hurigana-0-0")).color).toBe("#999");
    expect(queryByText("ごをまなぶ。")).toBeNull();
    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual(["語を学ぶ。"]);

    fireEvent.press(getByText("がな"));

    expect(getByTestId("kanji-collocation-back-side")).toBeTruthy();
    expect(flattenStyleOf(getByTestId("kanji-collocation-meaning-hurigana-0-0")).color).toBe("#999");
    expect(flattenStyleOf(getByTestId("kanji-collocation-reading-hurigana-0-0")).color).toBe("#999");
    expect(queryByText("ごをまなぶ。")).toBeNull();
    expect(getAllByText("(ご)").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("(まな)").length).toBeGreaterThanOrEqual(1);

    fireEvent.press(getByText("がな"));

    expect(flattenStyleOf(getByTestId("kanji-collocation-meaning-hurigana-0-0")).color).toBe("#999");
    expect(flattenStyleOf(getByTestId("kanji-collocation-reading-hurigana-0-0")).color).toBe("#999");
    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual(["語を学ぶ。"]);
  });

  it("renders meaning and reading hurigana at font size 8 when がな is active", () => {
    const screen = render(
      <KanjiCollocationCard item={buildKanjiWord()} />,
    );
    flipToBack(screen);
    const { getByText, getByTestId } = screen;

    fireEvent.press(getByText("がな"));

    expect(flattenStyleOf(getByTestId("kanji-collocation-meaning-hurigana-0-0")).fontSize).toBe(8);
    expect(flattenStyleOf(getByTestId("kanji-collocation-reading-hurigana-0-0")).fontSize).toBe(8);
  });

  it("lays out meaning and reading example rows above their hurigana rows", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    const meaningPairsContainer = screen.getByTestId(
      "kanji-collocation-meaning-pairs-container-0",
    );
    const readingPairsContainer = screen.getByTestId(
      "kanji-collocation-reading-pairs-container-0",
    );
    const meaningPairItem = screen.getByTestId(
      "kanji-collocation-meaning-pair-item-0-0",
    );
    const readingPairItem = screen.getByTestId(
      "kanji-collocation-reading-pair-item-0-0",
    );
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
    expect(flattenStyleOf(meaningPairsContainer)).toEqual(
      expect.objectContaining({
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }),
    );
    expect(flattenStyleOf(readingPairsContainer)).toEqual(
      expect.objectContaining({
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }),
    );
    expect(flattenStyleOf(meaningPairItem)).toEqual(
      expect.objectContaining({
        flexDirection: "column",
        alignItems: "stretch",
        alignSelf: "flex-start",
      }),
    );
    expect(flattenStyleOf(readingPairItem)).toEqual(
      expect.objectContaining({
        flexDirection: "column",
        alignItems: "stretch",
        alignSelf: "flex-start",
      }),
    );
    expect(flattenStyleOf(meaningMainRow)).toEqual(
      expect.objectContaining({
        flexDirection: "row",
        flexWrap: "nowrap",
        alignSelf: "stretch",
      }),
    );
    expect(flattenStyleOf(readingMainRow)).toEqual(
      expect.objectContaining({
        flexDirection: "row",
        flexWrap: "nowrap",
        alignSelf: "stretch",
      }),
    );
    expect(flattenStyleOf(screen.getByTestId("kanji-collocation-meaning-hurigana-0-0"))).toEqual(
      expect.objectContaining({
        alignSelf: "stretch",
        textAlign: "left",
        color: "#999",
      }),
    );
    expect(flattenStyleOf(screen.getByTestId("kanji-collocation-reading-hurigana-0-0"))).toEqual(
      expect.objectContaining({
        alignSelf: "stretch",
        textAlign: "left",
        color: "#999",
      }),
    );

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
    const { getByText, getByTestId, queryByText } = screen;

    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual([matchingExample]);

    fireEvent.press(getByText("がな"));

    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual([matchingExample]);
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
    const { getByText, getAllByText, getByTestId } = screen;

    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual([
      "一月新しい一年の始まりだ。",
    ]);
    expect(textChildrenOf(getByTestId("kanji-collocation-example-sizer-0"))).toEqual([
      "一月新しい一年の始まりだ。",
    ]);
    expect(flattenStyleOf(getByTestId("kanji-collocation-example-sizer-0"))).toEqual(
      expect.objectContaining({
        color: "transparent",
        backgroundColor: "transparent",
      }),
    );

    fireEvent.press(getByText("がな"));

    expect(getAllByText("(いち)").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("(がつ)").length).toBeGreaterThanOrEqual(1);
    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual(
      expect.arrayContaining(["一", "(いち)", "月", "(がつ)"]),
    );
    expect(textChildrenOf(getByTestId("kanji-collocation-example-sizer-0"))).toEqual(
      expect.arrayContaining(["一", "(いち)", "月", "(がつ)"]),
    );
    expect(
      StyleSheet.flatten(
        getByTestId("kanji-collocation-example-furigana-segment-0-1").props
          .style,
      ).fontSize,
    ).toBe(12);
  });

  it("resets parenthetical kana visibility after the card becomes inactive", () => {
    const item = buildKanjiWord({
      kanji: "一",
      example: ["一(いち)月(がつ)に行く。"],
      exampleHurigana: ["いちがつにいく。"],
      exampleEnglishTranslation: ["Go in January."],
    });
    const screen = render(<KanjiCollocationCard item={item} isActive />);
    flipToBack(screen);
    const { getByText, getAllByText, getByTestId, queryByText, rerender } =
      screen;

    fireEvent.press(getByText("がな"));

    expect(getAllByText("(いち)").length).toBeGreaterThanOrEqual(1);
    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual(
      expect.arrayContaining(["一", "(いち)", "月", "(がつ)"]),
    );

    rerender(<KanjiCollocationCard item={item} isActive={false} />);
    rerender(<KanjiCollocationCard item={item} isActive />);
    flipToBack(screen);

    expect(queryByText("(いち)")).toBeNull();
    expect(queryByText("(がつ)")).toBeNull();
    expect(textChildrenOf(getByTestId("kanji-collocation-example-visible-0"))).toEqual([
      "一月に行く。",
    ]);
  });

  it("lays out general examples above their localized translations", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    const generalExampleItem = screen.getByTestId(
      "kanji-collocation-example-item-0",
    );

    expect(textChildrenOf(generalExampleItem)).toEqual(
      expect.arrayContaining(["語を学ぶ。", "Learn words."]),
    );
    expect(flattenStyleOf(generalExampleItem)).toEqual(
      expect.objectContaining({
        flexDirection: "column",
        alignItems: "flex-start",
        alignSelf: "flex-start",
      }),
    );
  });

  it("uses exampleHurigana for Japanese TTS when available", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    const { getByText, getByTestId } = screen;

    fireEvent.press(getByTestId("kanji-collocation-example-visible-0"));

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

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-back-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-face-side")).toBeNull();
  });

  it("flips back to the face side when the back side background is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    fireEvent.press(screen.getByTestId("kanji-collocation-back-side"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when the back scroll background is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);

    fireEvent.press(screen.getByTestId("kanji-collocation-back-scroll-background"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("does not stop speech when がな is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByText("がな"));

    expect(mockStopCardSpeech).not.toHaveBeenCalled();
    expect(screen.getByTestId("kanji-collocation-back-side")).toBeTruthy();
  });

  it("flips back to the face side when the meaning-reading divider is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-divider-meaning-reading"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when the reading-example divider is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-divider-reading-example"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when a section title row is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-example-title-row"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when a section title text on the back side is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByText("EXAMPLE"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when a group label row is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-meaning-value-row-0"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when a group label text on the back side is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByText("word"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("flips back to the face side when a meaning example row background is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-meaning-examples-row-0"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("speaks without flipping when a meaning example item is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockSpeak.mockClear();
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-meaning-pair-item-0-0"));

    expect(mockSpeak).toHaveBeenCalledWith("じゅくご", {
      language: "ja-JP",
    });
    expect(mockStopCardSpeech).not.toHaveBeenCalled();
    expect(screen.getByTestId("kanji-collocation-back-side")).toBeTruthy();
  });

  it("flips back to the face side when a reading example row background is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-reading-examples-row-0"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("speaks without flipping when a reading example item is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockSpeak.mockClear();
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-reading-pair-item-0-0"));

    expect(mockSpeak).toHaveBeenCalledWith("にほんご", {
      language: "ja-JP",
    });
    expect(mockStopCardSpeech).not.toHaveBeenCalled();
    expect(screen.getByTestId("kanji-collocation-back-side")).toBeTruthy();
  });

  it("flips back to the face side when the general example row background is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-example-row"));

    expect(mockStopCardSpeech).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("kanji-collocation-face-side")).toBeTruthy();
    expect(screen.queryByTestId("kanji-collocation-back-side")).toBeNull();
  });

  it("speaks without flipping when a general example item is pressed", () => {
    const screen = render(<KanjiCollocationCard item={buildKanjiWord()} />);
    flipToBack(screen);
    mockSpeak.mockClear();
    mockStopCardSpeech.mockClear();

    fireEvent.press(screen.getByTestId("kanji-collocation-example-item-0"));

    expect(mockSpeak).toHaveBeenCalledWith("ごをまなぶ。", {
      language: "ja-JP",
    });
    expect(mockStopCardSpeech).not.toHaveBeenCalled();
    expect(screen.getByTestId("kanji-collocation-back-side")).toBeTruthy();
  });
});
