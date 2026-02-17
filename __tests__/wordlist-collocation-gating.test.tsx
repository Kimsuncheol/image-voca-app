import { act, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { WordList } from "../components/course-wordbank/WordList";
import { SavedWord } from "../components/wordbank/WordCard";

const mockPagerApi = {
  setPage: jest.fn(),
  setPageWithoutAnimation: jest.fn(),
  setScrollEnabled: jest.fn(),
};
let mockPagerProps: any = null;
const mockFlipHandlers = new Map<string, (() => void) | undefined>();
const mockImpactAsync = jest.fn().mockResolvedValue(undefined);
const originalExpoOs = process.env.EXPO_OS;

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("expo-haptics", () => ({
  __esModule: true,
  ImpactFeedbackStyle: {
    Light: "Light",
  },
  impactAsync: (...args: any[]) => mockImpactAsync(...args),
}));

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

const findAnchorStyleInAncestors = (node: any) => {
  let current = node;
  while (current) {
    const flattened = StyleSheet.flatten(current.props?.style);
    if (
      flattened &&
      (Object.prototype.hasOwnProperty.call(flattened, "top") ||
        Object.prototype.hasOwnProperty.call(flattened, "bottom"))
    ) {
      return flattened;
    }
    current = current.parent;
  }
  return {};
};

describe("WordList collocation flip gating", () => {
  beforeEach(() => {
    process.env.EXPO_OS = "ios";
    mockPagerApi.setPage.mockClear();
    mockPagerApi.setPageWithoutAnimation.mockClear();
    mockPagerApi.setScrollEnabled.mockClear();
    mockPagerProps = null;
    mockFlipHandlers.clear();
    mockImpactAsync.mockClear();
  });

  afterAll(() => {
    process.env.EXPO_OS = originalExpoOs;
  });

  const selectPage = (position: number) => {
    act(() => {
      mockPagerProps.onPageSelected({ nativeEvent: { position } });
    });
  };

  const scrollPage = (position: number, offset: number) => {
    act(() => {
      mockPagerProps.onPageScroll({ nativeEvent: { position, offset } });
    });
  };

  const unlockCard = (word: string) => {
    act(() => {
      const handler = mockFlipHandlers.get(word);
      handler?.();
    });
  };

  test("blocks forward swipe early and shows feedback until current card is flipped", () => {
    const { getByText } = render(
      <WordList
        words={buildWords()}
        courseId="COLLOCATION"
        isDark={false}
        onDelete={jest.fn()}
      />,
    );

    scrollPage(0, 0.2);
    scrollPage(0, 0.25);
    expect(mockPagerApi.setPageWithoutAnimation).toHaveBeenCalledWith(0);
    expect(mockPagerApi.setPageWithoutAnimation).toHaveBeenCalledTimes(1);
    const hintTextNode = getByText("swipe.hints.flipFirst");
    const hintStyle = findAnchorStyleInAncestors(hintTextNode);
    expect(hintTextNode).toBeTruthy();
    expect(hintStyle.top).toBe(36);
    expect(hintStyle.bottom).toBeUndefined();
    expect(mockImpactAsync).toHaveBeenCalledTimes(1);

    mockPagerApi.setPageWithoutAnimation.mockClear();
    unlockCard("dramatic drop");
    selectPage(1);
    expect(mockPagerApi.setPageWithoutAnimation).not.toHaveBeenCalled();
  });

  test("does not block early forward drag when current card is already unlocked", () => {
    const { queryByText } = render(
      <WordList
        words={buildWords()}
        courseId="COLLOCATION"
        isDark={false}
        onDelete={jest.fn()}
      />,
    );

    unlockCard("dramatic drop");
    scrollPage(0, 0.2);

    expect(mockPagerApi.setPageWithoutAnimation).not.toHaveBeenCalled();
    expect(queryByText("swipe.hints.flipFirst")).toBeNull();
    expect(mockImpactAsync).not.toHaveBeenCalled();
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
