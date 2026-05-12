import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { FontSizes } from "../constants/fontSizes";
import { FontWeights } from "../constants/fontWeights";
import {
  isWordsPlacementCorrect,
  serializePlacementAnswer,
  WordsPlacementGame,
} from "../components/course/WordsPlacementGame";
import type { WordPlacementChunk } from "../src/course/quizUtils";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

const chunks: WordPlacementChunk[] = [
  {
    id: "chunk-2",
    text: "spoil",
    type: "answer",
    order: 2,
  },
  {
    id: "chunk-1",
    text: "Too much help may",
    type: "sentence_chunk",
    order: 1,
  },
  {
    id: "chunk-3",
    text: "your child.",
    type: "sentence_chunk",
    order: 3,
  },
];

describe("WordsPlacementGame", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("validates selected chunks by order instead of input array order", () => {
    const selected = [chunks[1], chunks[0], chunks[2]];

    expect(isWordsPlacementCorrect(selected, chunks)).toBe(true);
    expect(isWordsPlacementCorrect(chunks, chunks)).toBe(false);
  });

  it("moves chips into the answer area and auto-submits only when complete", () => {
    const onAnswer = jest.fn();
    const screen = render(
      <WordsPlacementGame
        word="spoil"
        promptText="망치다"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        userAnswer=""
        showResult={false}
        isCorrect={false}
        onAnswer={onAnswer}
      />,
    );

    expect(screen.getByTestId("words-placement-build-card")).toBeTruthy();
    const promptSectionStyle = StyleSheet.flatten(
      screen.getByTestId("words-placement-prompt-section").props.style,
    );
    const answerAreaStyle = StyleSheet.flatten(
      screen.getByTestId("words-placement-answer-area").props.style,
    );
    expect(promptSectionStyle.backgroundColor).toBe("#f5f5f5");
    expect(answerAreaStyle.backgroundColor).toBe("#fff");
    expect(promptSectionStyle.backgroundColor).not.toBe(
      answerAreaStyle.backgroundColor,
    );
    expect(screen.getByTestId("words-placement-prompt").props.children).toBe(
      "망치다",
    );
    expect(screen.getByText("Build a sentence with")).toBeTruthy();
    expect(
      screen.getByTestId("words-placement-answer-instruction").props.children,
    ).toBe("Tap chunks below to build the sentence");
    expect(screen.getByTestId("words-placement-empty-selection")).toBeTruthy();
    const promptStyle = StyleSheet.flatten(
      screen.getByTestId("words-placement-prompt").props.style,
    );
    expect(promptStyle).toMatchObject({
      fontSize: FontSizes.body,
      fontWeight: FontWeights.normal,
      textAlign: "left",
    });
    const answerInstructionStyle = StyleSheet.flatten(
      screen.getByTestId("words-placement-answer-instruction").props.style,
    );
    expect(answerInstructionStyle).toMatchObject({
      textAlign: "left",
    });
    expect(screen.queryByTestId("words-placement-submit")).toBeNull();

    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-1"));
    expect(screen.getByTestId("words-placement-selected-chunk-1")).toBeTruthy();
    expect(
      screen.getByTestId("words-placement-answer-instruction").props.children,
    ).toBe("Tap chunks below to build the sentence");
    expect(screen.queryByTestId("words-placement-empty-selection")).toBeNull();

    fireEvent.press(screen.getByTestId("words-placement-selected-chunk-1"));
    expect(screen.queryByTestId("words-placement-selected-chunk-1")).toBeNull();
    expect(screen.getByTestId("words-placement-empty-selection")).toBeTruthy();

    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-1"));
    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-2"));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onAnswer).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-3"));

    act(() => {
      jest.advanceTimersByTime(499);
    });

    expect(onAnswer).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(onAnswer).toHaveBeenCalledWith(
      serializePlacementAnswer([chunks[1], chunks[0], chunks[2]]),
    );
  });

  it("shows wrong retry state without revealing the target sentence", () => {
    const onAnswer = jest.fn();
    const screen = render(
      <WordsPlacementGame
        word="spoil"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        translations={["너무 많은 도움은 아이를 망칠 수 있다."]}
        userAnswer=""
        showResult={false}
        isCorrect={false}
        onAnswer={onAnswer}
      />,
    );

    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-2"));
    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-1"));
    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-3"));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    const wrongAnswer = serializePlacementAnswer([chunks[0], chunks[1], chunks[2]]);
    expect(onAnswer).toHaveBeenCalledWith(wrongAnswer);

    screen.update(
      <WordsPlacementGame
        word="spoil"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        translations={["너무 많은 도움은 아이를 망칠 수 있다."]}
        userAnswer={wrongAnswer}
        showResult={true}
        isCorrect={false}
        onAnswer={onAnswer}
      />,
    );

    expect(screen.getByTestId("words-placement-wrong")).toBeTruthy();
    expect(screen.getByTestId("words-placement-build-card")).toBeTruthy();
    expect(screen.getByTestId("words-placement-selected-chunk-2")).toBeTruthy();
    expect(screen.getByTestId("words-placement-selected-chunk-1")).toBeTruthy();
    expect(screen.getByTestId("words-placement-selected-chunk-3")).toBeTruthy();
    expect(screen.queryByText("Too much help may spoil your child.")).toBeNull();
    expect(screen.queryByText("너무 많은 도움은 아이를 망칠 수 있다.")).toBeNull();
  });

  it("keeps the solved chunks in the build card without a below-card reveal on success", () => {
    const onAnswer = jest.fn();
    const screen = render(
      <WordsPlacementGame
        word="spoil"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        translations={["Too much help spoils a child.", "너무 많은 도움은 아이를 망친다."]}
        userAnswer=""
        showResult={false}
        isCorrect={false}
        onAnswer={onAnswer}
      />,
    );

    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-1"));
    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-2"));
    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-3"));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onAnswer).toHaveBeenCalledWith("chunk-1|chunk-2|chunk-3");

    screen.update(
      <WordsPlacementGame
        word="spoil"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        translations={["Too much help spoils a child.", "너무 많은 도움은 아이를 망친다."]}
        userAnswer="chunk-1|chunk-2|chunk-3"
        showResult={true}
        isCorrect={true}
        onAnswer={onAnswer}
      />,
    );

    expect(screen.getByTestId("words-placement-build-card")).toBeTruthy();
    expect(screen.getByTestId("words-placement-selected-chunk-1")).toBeTruthy();
    expect(screen.getByTestId("words-placement-selected-chunk-2")).toBeTruthy();
    expect(screen.getByTestId("words-placement-selected-chunk-3")).toBeTruthy();
    expect(screen.queryByText("Too much help may spoil your child.")).toBeNull();
    expect(screen.queryByTestId("words-placement-translations")).toBeNull();
    expect(screen.queryByText("Too much help spoils a child.")).toBeNull();
    expect(screen.queryByText("너무 많은 도움은 아이를 망친다.")).toBeNull();
    expect(screen.queryByText("Sentence chunks")).toBeNull();
  });

  it("does not render the below-card reveal when no translations exist", () => {
    const screen = render(
      <WordsPlacementGame
        word="spoil"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        translations={[]}
        userAnswer="chunk-1|chunk-2|chunk-3"
        showResult={true}
        isCorrect={true}
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.queryByText("Too much help may spoil your child.")).toBeNull();
    expect(screen.queryByTestId("words-placement-translations")).toBeNull();
  });
});
