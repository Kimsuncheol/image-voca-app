import { render } from "@testing-library/react-native";
import React from "react";
import { MatchingCard } from "../components/course/MatchingCard";

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text style={style}>{children}</Text>;
  },
}));

describe("MatchingCard", () => {
  it("renders inline chips in numbered meaning cards", () => {
    const { getByText, queryByText } = render(
      <MatchingCard
        text={"1. n. 이유\n2. v. 추론하다, 추리하다"}
        variant="meaning"
        isMatched={false}
        isSelected={false}
        onPress={jest.fn()}
        isDark={true}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("n")).toBeTruthy();
    expect(getByText("v")).toBeTruthy();
    expect(getByText(" 이유")).toBeTruthy();
    expect(getByText(" 추론하다, 추리하다")).toBeTruthy();
    expect(queryByText("n.")).toBeNull();
    expect(queryByText("v.")).toBeNull();
  });
});
