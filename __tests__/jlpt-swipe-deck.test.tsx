import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { JlptSwipeDeck } from "../components/course/vocabulary/JlptSwipeDeck";
import { VocabularyCard } from "../src/types/vocabulary";

let mockActiveIndex = 0;

jest.mock("../components/course/vocabulary/CarouselSwipeDeck", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    CarouselSwipeDeck: ({
      cards,
      dayNumber,
      savedWordIds,
      onSavedWordChange,
      renderCard,
    }: {
      cards: VocabularyCard[];
      dayNumber: number;
      savedWordIds: Set<string>;
      onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
      renderCard?: (params: {
        item: VocabularyCard;
        isSaved: boolean;
        dayNumber: number;
        onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
      }) => React.ReactNode;
    }) => (
      <View testID="mock-carousel-swipe-deck">
        {renderCard?.({
          item: cards[mockActiveIndex],
          isSaved: savedWordIds.has(cards[mockActiveIndex].id),
          dayNumber,
          onSavedWordChange,
        })}
      </View>
    ),
  };
});

jest.mock("../components/course/vocabulary/JlptVocabularyCard", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return {
    __esModule: true,
    JlptVocabularyCard: ({
      item,
      showKana,
      onToggleKana,
    }: {
      item: VocabularyCard;
      showKana?: boolean;
      onToggleKana?: () => void;
    }) => (
      <View>
        <Text testID="mock-jlpt-card-state">
          {`${item.id}:${showKana ? "on" : "off"}`}
        </Text>
        <Pressable testID="mock-jlpt-card-toggle" onPress={onToggleKana}>
          <Text>toggle kana</Text>
        </Pressable>
      </View>
    ),
  };
});

function buildCards(): VocabularyCard[] {
  return [
    {
      id: "N5_Day1_1",
      word: "間",
      meaning: "interval",
      pronunciation: "あいだ",
      example: "ご飯(ごはん)を食べます",
      course: "JLPT_N5",
    },
    {
      id: "N5_Day1_2",
      word: "家",
      meaning: "house",
      pronunciation: "いえ",
      example: "家(いえ)に帰ります",
      course: "JLPT_N5",
    },
  ];
}

describe("JlptSwipeDeck", () => {
  beforeEach(() => {
    mockActiveIndex = 0;
    jest.clearAllMocks();
  });

  it("tracks kana visibility independently per card within the same deck session", () => {
    const props = {
      cards: buildCards(),
      dayNumber: 1,
      savedWordIds: new Set<string>(),
      onSavedWordChange: jest.fn(),
      onSwipeRight: jest.fn(),
      onSwipeLeft: jest.fn(),
      onIndexChange: jest.fn(),
      onFinish: jest.fn(),
    };

    const { getByTestId, rerender } = render(<JlptSwipeDeck {...props} />);

    expect(getByTestId("mock-jlpt-card-state").props.children).toBe(
      "N5_Day1_1:off",
    );

    fireEvent.press(getByTestId("mock-jlpt-card-toggle"));

    expect(getByTestId("mock-jlpt-card-state").props.children).toBe(
      "N5_Day1_1:on",
    );

    mockActiveIndex = 1;
    rerender(<JlptSwipeDeck {...props} />);

    expect(getByTestId("mock-jlpt-card-state").props.children).toBe(
      "N5_Day1_2:off",
    );

    fireEvent.press(getByTestId("mock-jlpt-card-toggle"));

    expect(getByTestId("mock-jlpt-card-state").props.children).toBe(
      "N5_Day1_2:on",
    );

    mockActiveIndex = 0;
    rerender(<JlptSwipeDeck {...props} />);

    expect(getByTestId("mock-jlpt-card-state").props.children).toBe(
      "N5_Day1_1:on",
    );
  });

  it("resets per-card kana state when the deck receives a new card set", () => {
    const props = {
      cards: buildCards(),
      dayNumber: 1,
      savedWordIds: new Set<string>(),
      onSavedWordChange: jest.fn(),
      onSwipeRight: jest.fn(),
      onSwipeLeft: jest.fn(),
      onIndexChange: jest.fn(),
      onFinish: jest.fn(),
    };

    const { getByTestId, rerender } = render(<JlptSwipeDeck {...props} />);

    fireEvent.press(getByTestId("mock-jlpt-card-toggle"));

    expect(getByTestId("mock-jlpt-card-state").props.children).toBe(
      "N5_Day1_1:on",
    );

    rerender(
      <JlptSwipeDeck
        {...props}
        cards={[
          {
            id: "N5_Day2_1",
            word: "空",
            meaning: "sky",
            pronunciation: "そら",
            example: "空(そら)が青い",
            course: "JLPT_N5",
          },
          {
            id: "N5_Day2_2",
            word: "山",
            meaning: "mountain",
            pronunciation: "やま",
            example: "山(やま)に登る",
            course: "JLPT_N5",
          },
        ]}
      />,
    );

    expect(getByTestId("mock-jlpt-card-state").props.children).toBe(
      "N5_Day2_1:off",
    );
  });
});
