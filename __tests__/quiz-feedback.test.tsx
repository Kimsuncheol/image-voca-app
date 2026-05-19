import { render } from "@testing-library/react-native";
import React from "react";
import { QuizFeedback } from "../components/course/QuizFeedback";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { answer?: string; defaultValue?: string }) => {
      if (options?.defaultValue) return options.defaultValue;
      if (key === "quiz.feedback.correctAnswer") {
        return `Correct answer: ${options?.answer}`;
      }
      if (key === "quiz.feedback.incorrect") return "Incorrect";
      return key;
    },
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style }: any) => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text style={style}>{children}</Text>;
  },
}));

describe("QuizFeedback", () => {
  it("shows a compact correct badge for correct answers", () => {
    const screen = render(
      <QuizFeedback isCorrect correctAnswer="alpha" />,
    );

    expect(screen.getByTestId("quiz-feedback-correct")).toBeTruthy();
    expect(screen.getByText("Correct")).toBeTruthy();
    expect(screen.queryByText("Correct answer: alpha")).toBeNull();
  });

  it("shows incorrect feedback and the correct answer for wrong answers", () => {
    const screen = render(
      <QuizFeedback isCorrect={false} correctAnswer="alpha" />,
    );

    expect(screen.getByTestId("quiz-feedback-incorrect")).toBeTruthy();
    expect(screen.getByText("Incorrect")).toBeTruthy();
    expect(screen.getByText("Correct answer: alpha")).toBeTruthy();
  });
});
