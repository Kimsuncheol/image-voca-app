import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { FillInTheBlankGameOptions } from "../components/course/FillInTheBlankGameOptions";
import { MatchingGame } from "../components/course/MatchingGame";
import { FillInBlankQuiz } from "../components/dashboard/quiz-types/FillInBlankQuiz";
import { MatchingQuiz } from "../components/dashboard/quiz-types/MatchingQuiz";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text style={style}>{children}</Text>;
  },
}));

describe("JLPT quiz card fields", () => {
  it("renders course matching left cards with pronunciation details and right cards with meaning", () => {
    const screen = render(
      <MatchingGame
        questions={[
          {
            id: "q1",
            word: "間",
            meaning: "사이",
            pronunciation: "あいだ",
            pronunciationRoman: "aida",
          },
        ]}
        meanings={["사이"]}
        selectedWord={null}
        selectedMeaning={null}
        matchedPairs={{}}
        onSelectWord={jest.fn()}
        onSelectMeaning={jest.fn()}
        isDark={false}
        showPronunciationDetails
      />,
    );

    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.getByText("aida")).toBeTruthy();
    expect(screen.getByText("사이")).toBeTruthy();
    expect(screen.queryAllByText("あいだ")).toHaveLength(1);
    expect(screen.queryAllByText("aida")).toHaveLength(1);
  });

  it("renders course fill-in-the-blank options with pronunciation details and answers by word", () => {
    const onAnswer = jest.fn();
    const screen = render(
      <FillInTheBlankGameOptions
        options={[
          {
            word: "間",
            pronunciation: "あいだ",
            pronunciationRoman: "aida",
          },
        ]}
        correctAnswer="間"
        userAnswer=""
        showResult={false}
        onAnswer={onAnswer}
        showPronunciationDetails
      />,
    );

    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.getByText("aida")).toBeTruthy();

    fireEvent.press(screen.getByText("間"));
    expect(onAnswer).toHaveBeenCalledWith("間");
  });

  it("renders dashboard matching left cards with pronunciation details", () => {
    const screen = render(
      <MatchingQuiz
        pairs={[
          {
            word: "間",
            meaning: "사이",
            pronunciation: "あいだ",
            pronunciationRoman: "aida",
          },
        ]}
        isDark={false}
        onComplete={jest.fn()}
        onWrong={jest.fn()}
      />,
    );

    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.getByText("aida")).toBeTruthy();
    expect(screen.getByText("사이")).toBeTruthy();
    expect(screen.queryAllByText("あいだ")).toHaveLength(1);
    expect(screen.queryAllByText("aida")).toHaveLength(1);
  });

  it("renders dashboard fill-in-the-blank options with pronunciation details", () => {
    const screen = render(
      <FillInBlankQuiz
        clozeSentence="___を空ける"
        options={[
          {
            word: "間",
            pronunciation: "あいだ",
            pronunciationRoman: "aida",
          },
        ]}
        correctWord="間"
        selectedOption={null}
        isCorrect={null}
        isDark={false}
        onOptionPress={jest.fn()}
      />,
    );

    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.getByText("aida")).toBeTruthy();
  });
});
