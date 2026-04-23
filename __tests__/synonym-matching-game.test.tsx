import { act, render } from "@testing-library/react-native";
import React from "react";
import { SynonymMatchingGame } from "../components/course/SynonymMatchingGame";

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

describe("SynonymMatchingGame", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders word cards and synonym cards with synonym instructions", () => {
    const screen = render(
      <SynonymMatchingGame
        questions={[
          {
            id: "q1",
            word: "abandon",
            meaning: "leave behind",
            synonym: "forsake",
            pronunciation: "uh-BAN-duhn",
          },
          {
            id: "q2",
            word: "brief",
            meaning: "short",
            synonym: "concise",
          },
        ]}
        selectedWord={null}
        selectedMeaning={null}
        matchedPairs={{}}
        onSelectWord={jest.fn()}
        onSelectMeaning={jest.fn()}
        isDark={false}
      />,
    );

    expect(screen.getByText("quiz.synonymMatching.instructions")).toBeTruthy();
    expect(screen.getByText("abandon")).toBeTruthy();
    expect(screen.getByText("brief")).toBeTruthy();
    expect(screen.getByText("forsake")).toBeTruthy();
    expect(screen.getByText("concise")).toBeTruthy();
    expect(screen.queryByTestId("matching-meaning")).toBeNull();
  });

  it("calls onPageAdvance after a full page is matched", () => {
    jest.useFakeTimers();
    const onPageAdvance = jest.fn();
    const questions = [
      { id: "q1", word: "abandon", meaning: "leave behind", synonym: "forsake" },
      { id: "q2", word: "brief", meaning: "short", synonym: "concise" },
      { id: "q3", word: "calm", meaning: "quiet", synonym: "serene" },
      { id: "q4", word: "daring", meaning: "bold", synonym: "brave" },
      { id: "q5", word: "eager", meaning: "keen", synonym: "avid" },
      { id: "q6", word: "frank", meaning: "honest", synonym: "candid" },
    ];

    const screen = render(
      <SynonymMatchingGame
        questions={questions}
        selectedWord={null}
        selectedMeaning={null}
        matchedPairs={{
          abandon: "forsake",
          brief: "concise",
          calm: "serene",
          daring: "brave",
          eager: "avid",
        }}
        onSelectWord={jest.fn()}
        onSelectMeaning={jest.fn()}
        onPageAdvance={onPageAdvance}
        isDark={false}
      />,
    );

    expect(screen.queryByText("frank")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText("frank")).toBeTruthy();
    expect(screen.getByText("candid")).toBeTruthy();
    expect(onPageAdvance).toHaveBeenCalledTimes(1);
  });
});
