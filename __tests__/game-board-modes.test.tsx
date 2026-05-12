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

const mockWordsPlacementGame = jest.fn();

jest.mock("../components/course/WordsPlacementGame", () => ({
  WordsPlacementGame: (props: unknown) => {
    mockWordsPlacementGame(props);
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>WordsPlacementGame</Text>;
  },
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
  beforeEach(() => {
    mockWordsPlacementGame.mockClear();
  });

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

  it("routes words_placement to WordsPlacementGame", () => {
    const screen = render(
      <GameBoard
        {...baseProps}
        quizType="words_placement"
        currentQuestion={{
          ...baseProps.currentQuestion,
          targetExample: "Too much help may spoil your child.",
          placementPrompt: "망치다",
          placementChunks: [
            {
              id: "chunk-1",
              text: "Too much help may",
              type: "sentence_chunk",
              order: 1,
            },
          ],
          placementTranslations: ["Too much help spoils a child."],
        }}
      />,
    );

    expect(screen.getByText("WordsPlacementGame")).toBeTruthy();
    expect(mockWordsPlacementGame).toHaveBeenCalledWith(
      expect.objectContaining({
        promptText: "망치다",
        translations: ["Too much help spoils a child."],
      }),
    );
    expect(screen.queryByText("MatchingGame")).toBeNull();
  });
});
