import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CollocationSwipeable } from "../components/CollocationFlipCard/CollocationSwipeable.web";
import { VocabularyCard } from "../src/types/vocabulary";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../components/CollocationFlipCard/index", () => {
  const React = require("react");
  const { Text, TouchableOpacity, View } = require("react-native");

  const MockCollocationFlipCard = ({ data, onFirstFlipToBack }: any) => (
    <View>
      <Text>{data.collocation}</Text>
      <TouchableOpacity onPress={onFirstFlipToBack}>
        <Text>Flip card</Text>
      </TouchableOpacity>
    </View>
  );

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
      example: "example one",
      translation: "예문 하나",
      pronunciation: "desc",
      course: "COLLOCATION",
    },
    {
      id: "2",
      word: "change of scenery",
      meaning: "상황의 변화",
      example: "example two",
      translation: "예문 둘",
      pronunciation: "desc",
      course: "COLLOCATION",
    },
  ] as VocabularyCard[];
}

describe("CollocationSwipeable.web", () => {
  test("blocks next until the current card is flipped", () => {
    const onIndexChange = jest.fn();
    const onFinish = jest.fn();
    const screen = render(
      <CollocationSwipeable
        data={buildCards()}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
        renderFinalPage={() => <Text>Finish page</Text>}
      />,
    );

    fireEvent.press(screen.getByLabelText("Next card"));

    expect(screen.getByText("dramatic drop")).toBeTruthy();
    expect(screen.getByText("swipe.hints.flipFirst")).toBeTruthy();
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  test("advances after flip and reaches the finish page", () => {
    const onIndexChange = jest.fn();
    const onFinish = jest.fn();
    const screen = render(
      <CollocationSwipeable
        data={buildCards()}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
        renderFinalPage={() => <Text>Finish page</Text>}
      />,
    );

    fireEvent.press(screen.getByText("Flip card"));
    fireEvent.press(screen.getByLabelText("Next card"));

    expect(screen.getByText("change of scenery")).toBeTruthy();
    expect(onIndexChange).toHaveBeenCalledWith(1);

    fireEvent.press(screen.getByText("Flip card"));
    fireEvent.press(screen.getByLabelText("Next card"));

    expect(screen.getByText("Finish page")).toBeTruthy();
    expect(screen.queryByLabelText("Previous card")).toBeNull();
    expect(screen.queryByLabelText("Next card")).toBeNull();
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
