import { act, render } from "@testing-library/react-native";
import React from "react";
import { MatchingGame } from "../components/course/MatchingGame";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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

jest.mock("../components/common/InlineMeaningWithChips", () => ({
  InlineMeaningWithChips: ({ meaning }: { meaning: string }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text>{meaning}</Text>;
  },
}));

describe("MatchingGame server choice order", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("filters visible page choices while preserving saved choice order", () => {
    const screen = render(
      <MatchingGame
        questions={[
          {
            id: "i1",
            word: "alpha",
            meaning: "first",
            matchChoiceText: "first",
          },
          {
            id: "i2",
            word: "beta",
            meaning: "second",
            matchChoiceText: "second",
          },
        ]}
        meanings={["second", "first", "unused"]}
        selectedWord={null}
        selectedMeaning={null}
        matchedPairs={{}}
        onSelectWord={jest.fn()}
        onSelectMeaning={jest.fn()}
        isDark={false}
      />,
    );

    const textValues = screen.UNSAFE_getAllByType(
      jest.requireActual<typeof import("react-native")>("react-native").Text,
    ).map((node) => node.props.children);

    expect(textValues.indexOf("second")).toBeLessThan(
      textValues.indexOf("first"),
    );
    expect(screen.queryByText("unused")).toBeNull();
  });

  it("calls onPageAdvance after a full page is matched", () => {
    jest.useFakeTimers();
    const onPageAdvance = jest.fn();
    const questions = [
      { id: "i1", word: "alpha", meaning: "first", matchChoiceText: "first" },
      { id: "i2", word: "beta", meaning: "second", matchChoiceText: "second" },
      { id: "i3", word: "gamma", meaning: "third", matchChoiceText: "third" },
      { id: "i4", word: "delta", meaning: "fourth", matchChoiceText: "fourth" },
      { id: "i5", word: "epsilon", meaning: "fifth", matchChoiceText: "fifth" },
      { id: "i6", word: "zeta", meaning: "sixth", matchChoiceText: "sixth" },
    ];

    const screen = render(
      <MatchingGame
        questions={questions}
        meanings={questions.map((question) => question.matchChoiceText)}
        selectedWord={null}
        selectedMeaning={null}
        matchedPairs={{
          alpha: "first",
          beta: "second",
          gamma: "third",
          delta: "fourth",
          epsilon: "fifth",
        }}
        onSelectWord={jest.fn()}
        onSelectMeaning={jest.fn()}
        onPageAdvance={onPageAdvance}
        isDark={false}
      />,
    );

    expect(screen.queryByText("zeta")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText("zeta")).toBeTruthy();
    expect(onPageAdvance).toHaveBeenCalledTimes(1);
  });
});
