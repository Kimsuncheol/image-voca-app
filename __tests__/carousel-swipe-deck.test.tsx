import { render } from "@testing-library/react-native";
import React from "react";
import { View } from "react-native";
import { CarouselSwipeDeck } from "../components/course/vocabulary/CarouselSwipeDeck";
import { VocabularyCard } from "../src/types/vocabulary";

type PanEvent = {
  translationX: number;
  velocityX: number;
};

let panEndHandler: ((event: PanEvent) => void) | undefined;

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => (
      <View testID="gesture-detector">{children}</View>
    ),
    Gesture: {
      Pan: () => {
        const builder = {
          runOnJS: jest.fn(() => builder),
          onUpdate: jest.fn(() => builder),
          onEnd: jest.fn((handler: (event: PanEvent) => void) => {
            panEndHandler = handler;
            return builder;
          }),
        };

        return builder;
      },
    },
  };
});

jest.mock("react-native-reanimated", () => {
  const { View } = jest.requireActual("react-native");

  return {
    __esModule: true,
    default: {
      View,
    },
    View,
    interpolate: (_value: number, _input: number[], output: number[]) => output[1],
    runOnJS: (fn: (...args: any[]) => unknown) => (...args: any[]) => fn(...args),
    useAnimatedStyle: (updater: () => object) => updater(),
    useSharedValue: (value: number) => ({ value }),
    withSpring: jest.fn(
      (
        toValue: number,
        configOrCallback?: object | ((finished?: boolean) => void),
        callback?: (finished?: boolean) => void,
      ) => {
        const completion =
          typeof configOrCallback === "function" ? configOrCallback : callback;
        completion?.(true);
        return toValue;
      },
    ),
  };
});

jest.mock("../components/swipe/SwipeCardItem", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    SwipeCardItem: ({ item }: { item: VocabularyCard }) => (
      <View testID={`card-${item.id}`} />
    ),
  };
});

function buildCards(): VocabularyCard[] {
  return [
    {
      id: "1",
      word: "alpha",
      meaning: "first",
      example: "example one",
      translation: "예문 하나",
      pronunciation: "alpha",
      course: "TOEIC",
    },
    {
      id: "2",
      word: "beta",
      meaning: "second",
      example: "example two",
      translation: "예문 둘",
      pronunciation: "beta",
      course: "TOEIC",
    },
  ] as VocabularyCard[];
}

describe("CarouselSwipeDeck", () => {
  beforeEach(() => {
    panEndHandler = undefined;
    jest.clearAllMocks();
  });

  it("advances to the next card without finishing early", () => {
    const cards = buildCards();
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const onIndexChange = jest.fn();
    const onFinish = jest.fn();

    render(
      <CarouselSwipeDeck
        cards={cards}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={onSwipeRight}
        onSwipeLeft={onSwipeLeft}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
      />,
    );

    panEndHandler?.({ translationX: -1000, velocityX: 0 });

    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).toHaveBeenCalledWith(cards[1]);
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("finishes exactly once after swiping past the last card", () => {
    const cards = buildCards();
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const onIndexChange = jest.fn();
    const onFinish = jest.fn();

    render(
      <CarouselSwipeDeck
        cards={cards}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={onSwipeRight}
        onSwipeLeft={onSwipeLeft}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
      />,
    );

    panEndHandler?.({ translationX: -1000, velocityX: 0 });
    panEndHandler?.({ translationX: -1000, velocityX: 0 });

    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).toHaveBeenCalledWith(cards[1]);
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
