import { render } from "@testing-library/react-native";
import React from "react";
import { GameBoard } from "../components/course/GameBoard";

jest.mock("../components/course/GameScore", () => ({
  GameScore: () => null,
}));

jest.mock("../components/course/MatchingGame", () => ({
  MatchingGame: () => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>MatchingGame</Text>;
  },
}));

jest.mock("../components/course/SynonymMatchingGame", () => ({
  SynonymMatchingGame: () => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>SynonymMatchingGame</Text>;
  },
}));

jest.mock("../components/course/CollocationMatchingGame", () => ({
  CollocationMatchingGame: () => null,
}));

jest.mock("../components/course/CollocationGapFillSentenceGame", () => ({
  CollocationGapFillSentenceGame: () => null,
}));

jest.mock("../components/course/FillInTheBlankGame", () => ({
  FillInTheBlankGame: () => null,
}));

jest.mock("../components/course/MultipleChoiceGame", () => ({
  MultipleChoiceGame: () => null,
}));

jest.mock("../components/course/QuizFeedback", () => ({
  QuizFeedback: () => null,
}));

const baseProps = {
  currentQuestion: {
    id: "q1",
    word: "abandon",
    meaning: "leave behind",
    synonym: "forsake",
    correctAnswer: "leave behind",
  },
  questions: [
    {
      id: "q1",
      word: "abandon",
      meaning: "leave behind",
      synonym: "forsake",
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
  userAnswer: "",
  showResult: false,
  isCorrect: false,
  onAnswer: jest.fn(),
};

describe("GameBoard matching modes", () => {
  it("routes standard matching to MatchingGame", () => {
    const screen = render(<GameBoard {...baseProps} quizType="matching" />);

    expect(screen.getByText("MatchingGame")).toBeTruthy();
    expect(screen.queryByText("SynonymMatchingGame")).toBeNull();
  });

  it("routes synonym matching to SynonymMatchingGame", () => {
    const screen = render(
      <GameBoard {...baseProps} quizType="synonym-matching" matchingMode="synonym" />,
    );

    expect(screen.getByText("SynonymMatchingGame")).toBeTruthy();
    expect(screen.queryByText("MatchingGame")).toBeNull();
  });
});
