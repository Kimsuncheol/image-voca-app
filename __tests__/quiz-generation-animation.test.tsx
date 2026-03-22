import { act, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { QuizGenerationAnimation } from "../components/common/QuizGenerationAnimation";

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style, testID }: any) => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual("react-native");
    return ReactModule.createElement(Text, { style, testID }, children);
  },
}));

describe("QuizGenerationAnimation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
    });
    jest.useRealTimers();
  });

  it("renders the main label and initial generation step", () => {
    const screen = render(
      <QuizGenerationAnimation isDark={false} mode="card" />,
    );

    expect(screen.getByTestId("quiz-generation-root-card")).toBeTruthy();
    expect(screen.getByTestId("quiz-generation-title").props.children).toBe(
      "Creating quizzes...",
    );
    expect(screen.getByTestId("quiz-generation-step").props.children).toBe(
      "Fetching words",
    );
  });

  it("cycles the secondary step text over time", () => {
    const screen = render(
      <QuizGenerationAnimation isDark={false} mode="card" />,
    );

    act(() => {
      jest.advanceTimersByTime(420);
    });

    expect(screen.getByTestId("quiz-generation-step").props.children).toBe(
      "Mixing choices",
    );

    act(() => {
      jest.advanceTimersByTime(420);
    });

    expect(screen.getByTestId("quiz-generation-step").props.children).toBe(
      "Preparing questions",
    );
  });

  it("applies the expected light and dark step colors", () => {
    const lightScreen = render(
      <QuizGenerationAnimation isDark={false} mode="fullscreen" />,
    );
    const darkScreen = render(
      <QuizGenerationAnimation isDark mode="fullscreen" />,
    );

    expect(
      StyleSheet.flatten(lightScreen.getByTestId("quiz-generation-step").props.style)
        .color,
    ).toBe("#6b7280");
    expect(
      StyleSheet.flatten(darkScreen.getByTestId("quiz-generation-step").props.style)
        .color,
    ).toBe("#c7c7cc");
  });
});
