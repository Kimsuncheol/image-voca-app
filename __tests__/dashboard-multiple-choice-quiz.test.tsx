import { render } from "@testing-library/react-native";
import React from "react";
import { MultipleChoiceQuiz } from "../components/dashboard/quiz-types/MultipleChoiceQuiz";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style }: any) => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual("react-native");
    return ReactModule.createElement(Text, { style }, children);
  },
}));

jest.mock("../components/dashboard/quiz-types/PopQuizOption", () => ({
  PopQuizOption: ({ option }: { option: string }) => {
    const ReactModule = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual("react-native");
    return ReactModule.createElement(Text, null, option);
  },
}));

describe("Dashboard MultipleChoiceQuiz", () => {
  it("hides the secondary subtitle when pronunciation is undefined", () => {
    const screen = render(
      <MultipleChoiceQuiz
        quizItem={{
          word: "take place",
          meaning: "happen",
        }}
        options={["happen", "advance", "focus carefully", "cause doubt"]}
        selectedOption={null}
        isCorrect={null}
        isDark={false}
        onOptionPress={jest.fn()}
      />,
    );

    expect(screen.getByText("take place")).toBeTruthy();
    expect(screen.queryByText("used to describe an event happening")).toBeNull();
  });

  it("still shows pronunciation details when provided", () => {
    const screen = render(
      <MultipleChoiceQuiz
        quizItem={{
          word: "間",
          meaning: "사이",
          pronunciation: "あいだ",
          pronunciationRoman: "aida",
        }}
        options={["사이", "밖", "안", "앞"]}
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
