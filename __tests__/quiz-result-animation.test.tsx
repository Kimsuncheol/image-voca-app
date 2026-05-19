import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { QuizResultAnimation } from "../components/course/QuizResultAnimation";

describe("QuizResultAnimation", () => {
  it("renders children without decoration before result feedback", () => {
    const screen = render(
      <QuizResultAnimation showResult={false} isCorrect={false} questionId="q1">
        <Text>Quiz content</Text>
      </QuizResultAnimation>,
    );

    expect(screen.getByText("Quiz content")).toBeTruthy();
    expect(screen.getByTestId("quiz-result-animation")).toBeTruthy();
    expect(screen.queryByTestId("quiz-result-correct-glow")).toBeNull();
    expect(screen.queryByTestId("quiz-result-incorrect-glow")).toBeNull();
  });

  it("renders correct decoration during correct result feedback", () => {
    const screen = render(
      <QuizResultAnimation showResult isCorrect questionId="q1">
        <Text>Quiz content</Text>
      </QuizResultAnimation>,
    );

    expect(screen.getByTestId("quiz-result-correct-glow")).toBeTruthy();
    expect(screen.queryByTestId("quiz-result-incorrect-glow")).toBeNull();
  });

  it("renders incorrect decoration during incorrect result feedback", () => {
    const screen = render(
      <QuizResultAnimation showResult isCorrect={false} questionId="q1">
        <Text>Quiz content</Text>
      </QuizResultAnimation>,
    );

    expect(screen.getByTestId("quiz-result-incorrect-glow")).toBeTruthy();
    expect(screen.queryByTestId("quiz-result-correct-glow")).toBeNull();
  });

  it("keeps rendering after question changes reset animation values", () => {
    const screen = render(
      <QuizResultAnimation showResult isCorrect questionId="q1">
        <Text>First quiz</Text>
      </QuizResultAnimation>,
    );

    screen.rerender(
      <QuizResultAnimation showResult={false} isCorrect={false} questionId="q2">
        <Text>Second quiz</Text>
      </QuizResultAnimation>,
    );

    expect(screen.getByText("Second quiz")).toBeTruthy();
    expect(screen.queryByTestId("quiz-result-correct-glow")).toBeNull();
    expect(screen.queryByTestId("quiz-result-incorrect-glow")).toBeNull();
  });
});
