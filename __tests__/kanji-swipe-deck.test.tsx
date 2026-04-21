import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { KanjiSwipeDeck } from "../components/course/vocabulary/KanjiSwipeDeck";
import { stopAllCardSpeech } from "../src/hooks/useCardSpeechCleanup";
import type { KanjiWord } from "../src/types/vocabulary";

jest.mock("../src/hooks/useCardSpeechCleanup", () => ({
  stopAllCardSpeech: jest.fn(),
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => null,
}));

jest.mock("../components/course/vocabulary/CarouselSwipeDeck", () => ({
  __esModule: true,
  CarouselSwipeDeck: ({ onSwipeStart }: { onSwipeStart?: () => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable testID="mock-kanji-carousel-swipe-start" onPress={onSwipeStart}>
        <Text>Kanji carousel</Text>
      </Pressable>
    );
  },
}));

const kanjiWord: KanjiWord = {
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
};

describe("KanjiSwipeDeck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stops active speech when a Kanji swipe starts", () => {
    const screen = render(
      <KanjiSwipeDeck
        cards={[kanjiWord]}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("mock-kanji-carousel-swipe-start"));

    expect(stopAllCardSpeech).toHaveBeenCalledTimes(1);
  });
});
