import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { JlptSwipeDeck } from "../components/course/vocabulary/JlptSwipeDeck";
import { VocabularyCard } from "../src/types/vocabulary";

let mockVisibleIndices = [0];
const mockJlptCardRenders = new Map<string, number>();

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
        {mockVisibleIndices.map((index) => {
          const item = cards[index];
          if (!item) return null;

          return (
            <React.Fragment key={item.id}>
              {renderCard?.({
                item,
                isSaved: savedWordIds.has(item.id),
                dayNumber,
                onSavedWordChange,
              })}
            </React.Fragment>
          );
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
    }) => {
      mockJlptCardRenders.set(
        item.id,
        (mockJlptCardRenders.get(item.id) ?? 0) + 1,
      );

      return (
        <View>
          <Text testID={`mock-jlpt-card-state-${item.id}`}>
          {`${item.id}:${showKana ? "on" : "off"}`}
          </Text>
          <Pressable
            testID={`mock-jlpt-card-toggle-${item.id}`}
            onPress={onToggleKana}
          >
            <Text>toggle kana</Text>
          </Pressable>
        </View>
      );
    },
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
    mockVisibleIndices = [0];
    mockJlptCardRenders.clear();
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

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_1").props.children).toBe(
      "N5_Day1_1:off",
    );

    fireEvent.press(getByTestId("mock-jlpt-card-toggle-N5_Day1_1"));

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_1").props.children).toBe(
      "N5_Day1_1:on",
    );

    mockVisibleIndices = [1];
    rerender(<JlptSwipeDeck {...props} />);

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_2").props.children).toBe(
      "N5_Day1_2:off",
    );

    fireEvent.press(getByTestId("mock-jlpt-card-toggle-N5_Day1_2"));

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_2").props.children).toBe(
      "N5_Day1_2:on",
    );

    mockVisibleIndices = [0];
    rerender(<JlptSwipeDeck {...props} />);

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_1").props.children).toBe(
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

    fireEvent.press(getByTestId("mock-jlpt-card-toggle-N5_Day1_1"));

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_1").props.children).toBe(
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

    expect(getByTestId("mock-jlpt-card-state-N5_Day2_1").props.children).toBe(
      "N5_Day2_1:off",
    );
  });

  it("does not re-render sibling visible cards when toggling kana on the current card", () => {
    mockVisibleIndices = [0, 1];

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

    const { getByTestId } = render(<JlptSwipeDeck {...props} />);

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_1").props.children).toBe(
      "N5_Day1_1:off",
    );
    expect(getByTestId("mock-jlpt-card-state-N5_Day1_2").props.children).toBe(
      "N5_Day1_2:off",
    );

    const initialFirstCardRenderCount = mockJlptCardRenders.get("N5_Day1_1") ?? 0;
    const initialSecondCardRenderCount = mockJlptCardRenders.get("N5_Day1_2") ?? 0;

    fireEvent.press(getByTestId("mock-jlpt-card-toggle-N5_Day1_1"));

    expect(getByTestId("mock-jlpt-card-state-N5_Day1_1").props.children).toBe(
      "N5_Day1_1:on",
    );
    expect(getByTestId("mock-jlpt-card-state-N5_Day1_2").props.children).toBe(
      "N5_Day1_2:off",
    );
    expect(mockJlptCardRenders.get("N5_Day1_1")).toBeGreaterThan(
      initialFirstCardRenderCount,
    );
    expect(mockJlptCardRenders.get("N5_Day1_2")).toBe(
      initialSecondCardRenderCount,
    );
  });
});
