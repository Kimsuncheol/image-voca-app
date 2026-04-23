import { render } from "@testing-library/react-native";
import React from "react";
import { VocabularySwipeDeck } from "../components/course/vocabulary/VocabularySwipeDeck";
import type { KanjiWord } from "../src/types/vocabulary";

jest.mock("../components/course/vocabulary/KanjiSwipeDeck", () => ({
  __esModule: true,
  KanjiSwipeDeck: ({ cards }: { cards: KanjiWord[] }) => {
    const { Text } = require("react-native");
    return <Text>{`KanjiSwipeDeck:${cards[0]?.kanji ?? ""}`}</Text>;
  },
}));

jest.mock("../components/course/vocabulary/CarouselSwipeDeck", () => ({
  __esModule: true,
  CarouselSwipeDeck: () => {
    const { Text } = require("react-native");
    return <Text>CarouselSwipeDeck</Text>;
  },
}));

jest.mock("../components/course/vocabulary/JlptSwipeDeck", () => ({
  __esModule: true,
  JlptSwipeDeck: () => {
    const { Text } = require("react-native");
    return <Text>JlptSwipeDeck</Text>;
  },
}));

jest.mock("../components/CollocationFlipCard/CollocationSwipeable", () => ({
  __esModule: true,
  CollocationSwipeable: () => {
    const { Text } = require("react-native");
    return <Text>CollocationSwipeable</Text>;
  },
}));

const kanjiWord: KanjiWord = {
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
};

describe("VocabularySwipeDeck Kanji routing", () => {
  it("routes KANJI course cards to the Kanji-specific deck", () => {
    const { getByText, queryByText } = render(
      <VocabularySwipeDeck
        cards={[kanjiWord]}
        courseId="KANJI"
        isDark={false}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    expect(getByText("KanjiSwipeDeck:語")).toBeTruthy();
    expect(queryByText("CarouselSwipeDeck")).toBeNull();
  });
});
