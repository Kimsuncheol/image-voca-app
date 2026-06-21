import { render } from "@testing-library/react-native";
import React from "react";
import { GameBoard } from "../components/course/GameBoard";

const mockMatchingGame = jest.fn();

jest.mock("../components/course/MatchingGame", () => ({
  MatchingGame: (props: unknown) => {
    mockMatchingGame(props);
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>MatchingGame</Text>;
  },
}));

const baseProps = {
  quizType: "matching" as const,
  currentQuestion: {
    id: "q1",
    word: "abandon",
    meaning: "leave behind",
    correctAnswer: "leave behind",
  },
  questions: [
    {
      id: "q1",
      word: "abandon",
      meaning: "leave behind",
      correctAnswer: "leave behind",
    },
  ],
  progressCurrent: 1,
  isDark: false,
  matchingMeanings: ["leave behind"],
  selectedWord: null,
  selectedMeaning: null,
  matchedPairs: {},
  onSelectWord: jest.fn(),
  onSelectMeaning: jest.fn(),
};

describe("GameBoard", () => {
  beforeEach(() => {
    mockMatchingGame.mockClear();
  });

  it("renders the standard matching game", () => {
    const screen = render(<GameBoard {...baseProps} />);

    expect(screen.getByText("MatchingGame")).toBeTruthy();
    expect(mockMatchingGame).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: baseProps.questions,
        meanings: baseProps.matchingMeanings,
      }),
    );
  });
});
