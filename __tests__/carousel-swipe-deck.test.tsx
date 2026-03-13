import { act, render } from "@testing-library/react-native";
import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";
import { CarouselSwipeDeck } from "../components/course/vocabulary/CarouselSwipeDeck";
import { VocabularyCard } from "../src/types/vocabulary";

type PanEvent = {
  translationX: number;
  velocityX: number;
};

let panEndHandler: ((event: PanEvent) => void) | undefined;
const mockSwipeCardRenders = new Map<string, number>();

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
          activeOffsetX: jest.fn(() => builder),
          failOffsetY: jest.fn(() => builder),
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
  const React = require("react");
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
    useSharedValue: (value: number) => React.useRef({ value }).current,
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
  const { Text } = require("react-native");

  return {
    __esModule: true,
    SwipeCardItem: ({
      item,
      initialIsSaved,
    }: {
      item: VocabularyCard;
      initialIsSaved?: boolean;
    }) => {
      mockSwipeCardRenders.set(
        item.id,
        (mockSwipeCardRenders.get(item.id) ?? 0) + 1,
      );
      return (
        <Text testID={`card-${item.id}`}>
          {`${item.id}:${initialIsSaved ? "saved" : "unsaved"}`}
        </Text>
      );
    },
  };
});

function buildCards(
  count = 4,
  overrides: Array<Partial<VocabularyCard>> = [],
): VocabularyCard[] {
  return [
    {
      id: "1",
      word: "alpha",
      meaning: "first",
      example: "example one",
      translation: "예문 하나",
      pronunciation: "alpha",
      imageUrl: "https://cdn.example.com/alpha.jpg",
      course: "TOEIC",
      ...overrides[0],
    },
    {
      id: "2",
      word: "beta",
      meaning: "second",
      example: "example two",
      translation: "예문 둘",
      pronunciation: "beta",
      imageUrl: "https://cdn.example.com/beta.jpg",
      course: "TOEIC",
      ...overrides[1],
    },
    {
      id: "3",
      word: "gamma",
      meaning: "third",
      example: "example three",
      translation: "예문 셋",
      pronunciation: "gamma",
      imageUrl: "https://cdn.example.com/gamma.jpg",
      course: "TOEIC",
      ...overrides[2],
    },
    {
      id: "4",
      word: "delta",
      meaning: "fourth",
      example: "example four",
      translation: "예문 넷",
      pronunciation: "delta",
      imageUrl: "https://cdn.example.com/delta.jpg",
      course: "TOEIC",
      ...overrides[3],
    },
  ].slice(0, count) as VocabularyCard[];
}

describe("CarouselSwipeDeck", () => {
  beforeEach(() => {
    panEndHandler = undefined;
    mockSwipeCardRenders.clear();
    jest.clearAllMocks();
    (Image.prefetch as jest.Mock).mockResolvedValue(true);
  });

  it("mounts full card content only for the active card window", () => {
    const cards = buildCards();
    const { queryByTestId } = render(
      <CarouselSwipeDeck
        cards={cards}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    expect(queryByTestId("card-1")).toBeTruthy();
    expect(queryByTestId("card-2")).toBeTruthy();
    expect(queryByTestId("card-3")).toBeNull();
    expect(queryByTestId("card-4")).toBeNull();
  });

  it("advances to the next card without finishing early", () => {
    const cards = buildCards();
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const onIndexChange = jest.fn();
    const onFinish = jest.fn();

    const { queryByTestId } = render(
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

    act(() => {
      panEndHandler?.({ translationX: -1000, velocityX: 0 });
    });

    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).toHaveBeenCalledWith(cards[1]);
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
    expect(queryByTestId("card-1")).toBeTruthy();
    expect(queryByTestId("card-2")).toBeTruthy();
    expect(queryByTestId("card-3")).toBeTruthy();
    expect(queryByTestId("card-4")).toBeNull();
  });

  it("finishes exactly once after swiping past the last card", () => {
    const cards = buildCards(2);
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

    act(() => {
      panEndHandler?.({ translationX: -1000, velocityX: 0 });
      panEndHandler?.({ translationX: -1000, velocityX: 0 });
    });

    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).toHaveBeenCalledWith(cards[1]);
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("only re-renders the affected visible card when saved state changes", () => {
    const cards = buildCards();
    const { getByTestId, rerender } = render(
      <CarouselSwipeDeck
        cards={cards}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    expect(getByTestId("card-1").props.children).toBe("1:unsaved");
    expect(getByTestId("card-2").props.children).toBe("2:unsaved");

    const initialRenderCountCard1 = mockSwipeCardRenders.get("1") ?? 0;
    const initialRenderCountCard2 = mockSwipeCardRenders.get("2") ?? 0;

    rerender(
      <CarouselSwipeDeck
        cards={cards}
        dayNumber={1}
        savedWordIds={new Set(["1"])}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    expect(getByTestId("card-1").props.children).toBe("1:saved");
    expect(getByTestId("card-2").props.children).toBe("2:unsaved");
    expect(mockSwipeCardRenders.get("1")).toBe(initialRenderCountCard1 + 1);
    expect(mockSwipeCardRenders.get("2")).toBe(initialRenderCountCard2);
  });

  it("prefetches the next two upcoming image URLs on initial render", () => {
    render(
      <CarouselSwipeDeck
        cards={buildCards()}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    expect(Image.prefetch).toHaveBeenCalledWith(
      [
        "https://cdn.example.com/beta.jpg",
        "https://cdn.example.com/gamma.jpg",
      ],
      "memory-disk",
    );
  });

  it("prefetches the next unseen image URLs after swiping forward", () => {
    render(
      <CarouselSwipeDeck
        cards={buildCards()}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    act(() => {
      panEndHandler?.({ translationX: -1000, velocityX: 0 });
    });

    expect(Image.prefetch).toHaveBeenNthCalledWith(
      2,
      ["https://cdn.example.com/delta.jpg"],
      "memory-disk",
    );
  });

  it("skips missing image URLs and avoids duplicate prefetches within the deck session", () => {
    render(
      <CarouselSwipeDeck
        cards={buildCards(4, [
          {},
          { imageUrl: " https://cdn.example.com/shared.jpg " },
          { imageUrl: "https://cdn.example.com/shared.jpg" },
          { imageUrl: "   " },
        ])}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    expect(Image.prefetch).toHaveBeenCalledWith(
      ["https://cdn.example.com/shared.jpg"],
      "memory-disk",
    );

    act(() => {
      panEndHandler?.({ translationX: -1000, velocityX: 0 });
    });

    expect(Image.prefetch).toHaveBeenCalledTimes(1);
  });

  it("resets image prefetch deduplication when the deck cards change", () => {
    const { rerender } = render(
      <CarouselSwipeDeck
        cards={buildCards()}
        dayNumber={1}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    rerender(
      <CarouselSwipeDeck
        cards={buildCards(4, [
          { imageUrl: "https://cdn.example.com/new-alpha.jpg" },
          { imageUrl: "https://cdn.example.com/new-beta.jpg" },
          { imageUrl: "https://cdn.example.com/new-gamma.jpg" },
          {},
        ])}
        dayNumber={2}
        savedWordIds={new Set()}
        onSwipeRight={jest.fn()}
        onSwipeLeft={jest.fn()}
        onIndexChange={jest.fn()}
        onFinish={jest.fn()}
      />,
    );

    expect(Image.prefetch).toHaveBeenLastCalledWith(
      [
        "https://cdn.example.com/new-beta.jpg",
        "https://cdn.example.com/new-gamma.jpg",
      ],
      "memory-disk",
    );
  });
});
