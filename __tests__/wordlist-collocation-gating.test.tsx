import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { WordList } from "../components/course-wordbank/WordList";
import { SavedWord } from "../components/wordbank/WordCard";

const mockDeleteWord = jest.fn();

jest.mock("../components/course-wordbank/SwipeToDeleteRow", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text, TouchableOpacity, View } = require("react-native");

  const MockSwipeToDeleteRow = ({ itemId, onDelete, children }: any) => (
    <View testID={`swipe-row-${itemId}`}>
      <TouchableOpacity onPress={() => onDelete(itemId)}>
        <Text>{`delete-${itemId}`}</Text>
      </TouchableOpacity>
      {children}
    </View>
  );

  return {
    __esModule: true,
    SwipeToDeleteRow: MockSwipeToDeleteRow,
  };
});

jest.mock("../components/wordbank/WordCard", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text, View } = require("react-native");

  const MockWordCard = ({
    word,
    showPronunciation,
    expandExampleToContent,
  }: any) => (
    <View testID={`word-card-${word.id}`}>
      <Text>{word.word}</Text>
      <Text>{showPronunciation ? "show-pronunciation" : "hide-pronunciation"}</Text>
      <Text>{expandExampleToContent ? "expand-example" : "cap-example"}</Text>
    </View>
  );

  return {
    __esModule: true,
    WordCard: MockWordCard,
  };
});

function buildWords(course: string): SavedWord[] {
  return [
    {
      id: "1",
      word: "dramatic drop",
      meaning: "급격한 하락",
      translation: "급격한 하락",
      pronunciation: "desc",
      example: "example one",
      course,
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
      course,
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
      course,
      day: 1,
      addedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

describe("WordList fixed word bank layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders collocations as standard cards with pronunciation hidden", () => {
    const screen = render(
      <WordList
        words={buildWords("COLLOCATION")}
        courseId="COLLOCATION"
        isDark={false}
        onDeleteWord={mockDeleteWord}
      />,
    );

    expect(screen.getByTestId("word-card-1")).toBeTruthy();
    expect(screen.getByTestId("word-card-2")).toBeTruthy();
    expect(screen.getByTestId("word-card-3")).toBeTruthy();
    expect(screen.getAllByText("hide-pronunciation")).toHaveLength(3);
    expect(screen.getAllByText("expand-example")).toHaveLength(3);
  });

  test("passes delete callbacks through the swipe rows", () => {
    const screen = render(
      <WordList
        words={buildWords("COLLOCATION")}
        courseId="COLLOCATION"
        isDark={false}
        onDeleteWord={mockDeleteWord}
      />,
    );

    fireEvent.press(screen.getByText("delete-2"));
    expect(mockDeleteWord).toHaveBeenCalledWith("2");
  });

  test("renders non-collocation courses as full cards", () => {
    const screen = render(
      <WordList
        words={buildWords("TOEIC")}
        courseId="TOEIC"
        isDark={false}
        onDeleteWord={mockDeleteWord}
      />,
    );

    expect(screen.getAllByText("show-pronunciation")).toHaveLength(3);
    expect(screen.getAllByText("cap-example")).toHaveLength(3);
  });
});
