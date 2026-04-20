import { render } from "@testing-library/react-native";
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
});
