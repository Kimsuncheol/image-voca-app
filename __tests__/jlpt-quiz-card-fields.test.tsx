import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { FillInTheBlankGame } from "../components/course/FillInTheBlankGame";
import { FillInTheBlankGameClozeSentenceCard } from "../components/course/FillInTheBlankGameClozeSentenceCard";
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
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text style={style}>{children}</Text>;
  },
}));

jest.mock("../components/CollocationFlipCard/RoleplayRenderer", () => ({
  RoleplayRenderer: ({ content, renderText }: any) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { View } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <View>{renderText(content)}</View>;
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
    expect(screen.getByText("사이")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.queryByText("aida")).toBeNull();
  });

  it("hides duplicate pronunciation subtitles in course pronunciation matching", () => {
    const screen = render(
      <MatchingGame
        questions={[
          {
            id: "q1",
            word: "間",
            meaning: "사이",
            pronunciation: "あいだ",
          },
        ]}
        meanings={["あいだ"]}
        selectedWord={null}
        selectedMeaning={null}
        matchedPairs={{}}
        onSelectWord={jest.fn()}
        onSelectMeaning={jest.fn()}
        isDark={false}
        showPronunciationDetails
        matchingMode="pronunciation"
      />,
    );

    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.queryAllByText("あいだ")).toHaveLength(1);
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
    expect(screen.queryByText("aida")).toBeNull();

    fireEvent.press(screen.getByText("間"));
    expect(onAnswer).toHaveBeenCalledWith("間");
  });

  it("strips furigana from the course fill-in-the-blank sentence display", () => {
    const screen = render(
      <FillInTheBlankGameClozeSentenceCard
        clozeSentence="入(い)り口(ぐち)から入(はい)る。"
        translation="Enter through the entrance."
      />,
    );

    expect(screen.getByText("入り口から入る。")).toBeTruthy();
    expect(screen.queryByText("入(い)り口(ぐち)から入(はい)る。")).toBeNull();
  });

  it("renders course fill-in-the-blank as sentence, translation, then options", () => {
    const screen = render(
      <FillInTheBlankGame
        word="間"
        clozeSentence="Alpha beta."
        translation="Translated sentence."
        options={[{ word: "間" }, { word: "入口" }]}
        correctAnswer="間"
        userAnswer=""
        showResult={false}
        onAnswer={jest.fn()}
      />,
    );

    const Text = jest.requireActual<typeof import("react-native")>(
      "react-native",
    ).Text;
    const textValues = screen
      .UNSAFE_getAllByType(Text)
      .map((node) => node.props.children);

    expect(screen.getByText("Alpha beta.")).toBeTruthy();
    expect(screen.getByText("Translated sentence.")).toBeTruthy();
    expect(screen.getByText("間")).toBeTruthy();
    expect(textValues.indexOf("Alpha beta.")).toBeLessThan(
      textValues.indexOf("Translated sentence."),
    );
    expect(textValues.indexOf("Translated sentence.")).toBeLessThan(
      textValues.indexOf("間"),
    );
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
        instruction="hint"
      />,
    );

    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.getByText("사이")).toBeTruthy();
    expect(screen.queryAllByText("あいだ")).toHaveLength(1);
    expect(screen.queryByText("aida")).toBeNull();
  });

  it("renders dashboard pronunciation matching without duplicate left-side pronunciation subtitles", () => {
    const screen = render(
      <MatchingQuiz
        pairs={[
          {
            word: "間",
            meaning: "사이",
            pronunciation: "あいだ",
          },
        ]}
        isDark={false}
        onComplete={jest.fn()}
        onWrong={jest.fn()}
        matchingMode="pronunciation"
        instruction="hint"
      />,
    );

    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.queryAllByText("あいだ")).toHaveLength(1);
  });

  it("strips furigana from the dashboard fill-in-the-blank sentence and keeps option pronunciation details", () => {
    const screen = render(
      <FillInBlankQuiz
        clozeSentence="入(い)り口(ぐち)から入(はい)る。"
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

    expect(screen.getByText("入り口から入る。")).toBeTruthy();
    expect(screen.queryByText("入(い)り口(ぐち)から入(はい)る。")).toBeNull();
    expect(screen.getByText("間")).toBeTruthy();
    expect(screen.getByText("あいだ")).toBeTruthy();
    expect(screen.queryByText("aida")).toBeNull();
  });
});
