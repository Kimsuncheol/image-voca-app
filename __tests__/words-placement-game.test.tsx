import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
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
  it("validates selected chunks by order instead of input array order", () => {
    const selected = [chunks[1], chunks[0], chunks[2]];

    expect(isWordsPlacementCorrect(selected, chunks)).toBe(true);
    expect(isWordsPlacementCorrect(chunks, chunks)).toBe(false);
  });

  it("moves chips into the answer area and enables submit only when complete", () => {
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

    expect(screen.getByTestId("words-placement-prompt").props.children).toBe(
      "망치다",
    );
    expect(screen.getByTestId("words-placement-submit").props.accessibilityState)
      .toMatchObject({ disabled: true });

    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-1"));
    expect(screen.getByTestId("words-placement-selected-chunk-1")).toBeTruthy();

    fireEvent.press(screen.getByTestId("words-placement-selected-chunk-1"));
    expect(screen.queryByTestId("words-placement-selected-chunk-1")).toBeNull();

    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-1"));
    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-2"));
    fireEvent.press(screen.getByTestId("words-placement-choice-chunk-3"));

    fireEvent.press(screen.getByTestId("words-placement-submit"));

    expect(onAnswer).toHaveBeenCalledWith(
      serializePlacementAnswer([chunks[1], chunks[0], chunks[2]]),
    );
  });

  it("shows wrong retry state without revealing the target sentence", () => {
    const screen = render(
      <WordsPlacementGame
        word="spoil"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        translations={["너무 많은 도움은 아이를 망칠 수 있다."]}
        userAnswer="chunk-2|chunk-1|chunk-3"
        showResult={true}
        isCorrect={false}
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.getByTestId("words-placement-wrong")).toBeTruthy();
    expect(screen.queryByText("Too much help may spoil your child.")).toBeNull();
    expect(screen.queryByText("너무 많은 도움은 아이를 망칠 수 있다.")).toBeNull();
  });

  it("reveals the target sentence and translations on success", () => {
    const screen = render(
      <WordsPlacementGame
        word="spoil"
        targetExample="Too much help may spoil your child."
        chunks={chunks}
        translations={["Too much help spoils a child.", "너무 많은 도움은 아이를 망친다."]}
        userAnswer="chunk-1|chunk-2|chunk-3"
        showResult={true}
        isCorrect={true}
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.getByText("Too much help may spoil your child.")).toBeTruthy();
    expect(screen.getByTestId("words-placement-translations")).toBeTruthy();
    expect(screen.getByText("Too much help spoils a child.")).toBeTruthy();
    expect(screen.getByText("너무 많은 도움은 아이를 망친다.")).toBeTruthy();
  });

  it("does not render the translation section when no translations exist", () => {
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

    expect(screen.getByText("Too much help may spoil your child.")).toBeTruthy();
    expect(screen.queryByTestId("words-placement-translations")).toBeNull();
  });
});
