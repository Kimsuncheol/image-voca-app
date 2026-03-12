import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { WordList } from "../components/course-wordbank/WordList.web";
import { SavedWord } from "../components/wordbank/WordCard";

jest.mock("../src/stores/wordBankDisplayStore", () => ({
  useWordBankDisplayStore: () => ({
    collocationDisplay: "all",
    otherDisplay: "all",
  }),
}));

jest.mock("../components/CollocationFlipCard", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const MockCollocationFlipCard = ({ data, wordBankConfig }: any) => (
    <View>
      <Text>{data.collocation}</Text>
      <Text>{wordBankConfig?.isSelected ? "selected" : "idle"}</Text>
    </View>
  );

  return {
    __esModule: true,
    CollocationFlipCard: MockCollocationFlipCard,
    default: MockCollocationFlipCard,
  };
});

jest.mock("../components/wordbank/WordCard", () => {
  const React = require("react");
  const { Text, TouchableOpacity, View } = require("react-native");

  const MockWordCard = ({ word, isSelected, onStartDeleteMode, onToggleSelection }: any) => (
    <View>
      <Text>{word.word}</Text>
      <Text>{isSelected ? "selected" : "idle"}</Text>
      <TouchableOpacity onPress={() => onStartDeleteMode(word.id)}>
        <Text>Start delete {word.word}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onToggleSelection(word.id)}>
        <Text>Toggle {word.word}</Text>
      </TouchableOpacity>
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
      word: "change of scenery",
      meaning: "상황의 변화",
      translation: "상황의 변화",
      pronunciation: "desc",
      example: "example two",
      course: "COLLOCATION",
      day: 1,
      addedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

describe("WordList.web", () => {
  test("renders collocation words one at a time and navigates with buttons", () => {
    const screen = render(
      <WordList
        words={buildWords()}
        courseId="COLLOCATION"
        isDark={false}
        isDeleteMode={false}
        selectedIds={new Set()}
        onStartDeleteMode={jest.fn()}
        onToggleSelection={jest.fn()}
      />,
    );

    expect(screen.getByText("dramatic drop")).toBeTruthy();
    expect(screen.queryByText("change of scenery")).toBeNull();

    fireEvent.press(screen.getByLabelText("Next saved card"));

    expect(screen.getByText("change of scenery")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Previous saved card"));

    expect(screen.getByText("dramatic drop")).toBeTruthy();
  });

  test("passes delete-mode selection props through the web pager", () => {
    const screen = render(
      <WordList
        words={buildWords()}
        courseId="COLLOCATION"
        isDark={false}
        isDeleteMode={true}
        selectedIds={new Set(["2"])}
        onStartDeleteMode={jest.fn()}
        onToggleSelection={jest.fn()}
      />,
    );

    expect(screen.getByText("idle")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Next saved card"));

    expect(screen.getByText("selected")).toBeTruthy();
  });
});
