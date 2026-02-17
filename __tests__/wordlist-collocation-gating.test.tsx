import { act, render } from "@testing-library/react-native";
import React from "react";
import { WordList } from "../components/course-wordbank/WordList";
import { SavedWord } from "../components/wordbank/WordCard";

const mockPagerApi = {
  setPage: jest.fn(),
  setPageWithoutAnimation: jest.fn(),
  setScrollEnabled: jest.fn(),
};
let mockPagerProps: any = null;
const mockFlipHandlers = new Map<string, (() => void) | undefined>();

jest.mock("react-native-pager-view", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockPagerView = React.forwardRef(function MockPagerView(
    props: any,
    ref: any,
  ) {
    mockPagerProps = props;
    React.useImperativeHandle(ref, () => mockPagerApi);
    return <View testID="mock-pager">{props.children}</View>;
  });

  return {
    __esModule: true,
    default: MockPagerView,
  };
});

jest.mock("../components/CollocationFlipCard", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockCollocationFlipCard = ({ data, onFirstFlipToBack }: any) => {
    mockFlipHandlers.set(String(data.collocation), onFirstFlipToBack);
    return <View testID={`mock-card-${data.collocation}`} />;
  };

  return {
    __esModule: true,
    CollocationFlipCard: MockCollocationFlipCard,
    default: MockCollocationFlipCard,
  };
});

jest.mock("../components/wordbank/WordCard", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  const MockWordCard = ({ word }: { word: SavedWord }) => (
    <View testID={`word-card-${word.id}`}>
      <Text>{word.word}</Text>
    </View>
  );

  return {
    __esModule: true,
    WordCard: MockWordCard,
  };
});

function buildWords(): SavedWord[] {
  return [
    {
      id: "1",
      word: "dramatic drop",
      meaning: "급격한 하락",
      translation: "급격한 하락",
      pronunciation: "desc",
      example: "example one",
      course: "COLLOCATION",
      day: 1,
      addedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      word: "unseasonably cold",
      meaning: "계절에 맞지 않게 추운",
      translation: "계절에 맞지 않게 추운",
      pronunciation: "desc",
      example: "example two",
      course: "COLLOCATION",
      day: 1,
      addedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "3",
      word: "change of scenery",
      meaning: "상황의 변화",
      translation: "상황의 변화",
      pronunciation: "desc",
      example: "example three",
      course: "COLLOCATION",
      day: 1,
      addedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

describe("WordList collocation flip gating", () => {
  beforeEach(() => {
    mockPagerApi.setPage.mockClear();
    mockPagerApi.setPageWithoutAnimation.mockClear();
    mockPagerApi.setScrollEnabled.mockClear();
    mockPagerProps = null;
    mockFlipHandlers.clear();
  });

  const selectPage = (position: number) => {
    act(() => {
      mockPagerProps.onPageSelected({ nativeEvent: { position } });
    });
  };

  const unlockCard = (word: string) => {
    act(() => {
      const handler = mockFlipHandlers.get(word);
      handler?.();
    });
  };

  test("blocks forward swipe until current card is flipped", () => {
    render(
      <WordList
        words={buildWords()}
        courseId="COLLOCATION"
        isDark={false}
        onDelete={jest.fn()}
      />,
    );

    selectPage(1);
    expect(mockPagerApi.setPageWithoutAnimation).toHaveBeenCalledWith(0);

    mockPagerApi.setPageWithoutAnimation.mockClear();
    unlockCard("dramatic drop");
    selectPage(1);
    expect(mockPagerApi.setPageWithoutAnimation).not.toHaveBeenCalled();
  });

  test("allows backward swipe without current-card flip", () => {
    render(
      <WordList
        words={buildWords()}
        courseId="COLLOCATION"
        isDark={false}
        onDelete={jest.fn()}
      />,
    );

    unlockCard("dramatic drop");
    selectPage(1);
    mockPagerApi.setPageWithoutAnimation.mockClear();

    selectPage(0);
    expect(mockPagerApi.setPageWithoutAnimation).not.toHaveBeenCalled();
  });

  test("non-collocation branch remains standard list rendering", () => {
    const words = buildWords();
    const { getByTestId, queryByTestId } = render(
      <WordList
        words={words}
        courseId="TOEIC"
        isDark={false}
        onDelete={jest.fn()}
      />,
    );

    expect(getByTestId("word-card-1")).toBeTruthy();
    expect(getByTestId("word-card-2")).toBeTruthy();
    expect(getByTestId("word-card-3")).toBeTruthy();
    expect(queryByTestId("mock-pager")).toBeNull();
  });
});
