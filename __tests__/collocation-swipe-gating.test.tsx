import { act, render } from "@testing-library/react-native";
import React from "react";
import { View } from "react-native";
import { CollocationSwipeable } from "../components/CollocationFlipCard/CollocationSwipeable";
import { VocabularyCard } from "../src/types/vocabulary";

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

jest.mock("../components/CollocationFlipCard/index", () => {
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

function buildCards(): VocabularyCard[] {
  return [
    {
      id: "1",
      word: "dramatic drop",
      meaning: "급격한 하락",
      example: "A: example one",
      translation: "A: 예문 하나",
      pronunciation: "desc",
      course: "COLLOCATION",
    },
    {
      id: "2",
      word: "unseasonably cold",
      meaning: "계절에 맞지 않게 추운",
      example: "B: example two",
      translation: "B: 예문 둘",
      pronunciation: "desc",
      course: "COLLOCATION",
    },
    {
      id: "3",
      word: "change of scenery",
      meaning: "상황의 변화",
      example: "C: example three",
      translation: "C: 예문 셋",
      pronunciation: "desc",
      course: "COLLOCATION",
    },
  ] as VocabularyCard[];
}

describe("CollocationSwipeable flip gating", () => {
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

  test("blocks forward swipe when current card is not flipped", () => {
    const onIndexChange = jest.fn();
    const onFinish = jest.fn();

    render(
      <CollocationSwipeable
        data={buildCards()}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
        renderFinalPage={() => <View testID="final-page" />}
      />,
    );

    selectPage(1);

    expect(mockPagerApi.setPageWithoutAnimation).toHaveBeenCalledWith(0);
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  test("allows forward swipe after current card is flipped once", () => {
    const onIndexChange = jest.fn();

    render(
      <CollocationSwipeable data={buildCards()} onIndexChange={onIndexChange} />,
    );

    unlockCard("dramatic drop");
    selectPage(1);

    expect(mockPagerApi.setPageWithoutAnimation).not.toHaveBeenCalled();
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  test("allows backward swipe even if current card was not flipped", () => {
    const onIndexChange = jest.fn();

    render(
      <CollocationSwipeable data={buildCards()} onIndexChange={onIndexChange} />,
    );

    unlockCard("dramatic drop");
    selectPage(1);
    onIndexChange.mockClear();
    mockPagerApi.setPageWithoutAnimation.mockClear();

    selectPage(0);

    expect(mockPagerApi.setPageWithoutAnimation).not.toHaveBeenCalled();
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  test("blocks final page until last card is flipped", () => {
    const cards = buildCards().slice(0, 2);
    const onIndexChange = jest.fn();
    const onFinish = jest.fn();

    render(
      <CollocationSwipeable
        data={cards}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
        renderFinalPage={() => <View testID="final-page" />}
      />,
    );

    unlockCard("dramatic drop");
    selectPage(1);
    onIndexChange.mockClear();
    mockPagerApi.setPageWithoutAnimation.mockClear();

    // Attempt to move from card #2 to final page without flipping card #2
    selectPage(2);
    expect(mockPagerApi.setPageWithoutAnimation).toHaveBeenCalledWith(1);
    expect(onFinish).not.toHaveBeenCalled();

    // Ignore synthetic snap-back event and then unlock second card
    selectPage(1);
    unlockCard("unseasonably cold");
    selectPage(2);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });
});
