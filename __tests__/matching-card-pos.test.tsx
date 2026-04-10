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

  it("renders numbered CSAT idiom meaning cards without the POS gutter", () => {
    const { getByText, queryByTestId } = render(
      <MatchingCard
        text="1. 아주 드물게 2. 거의 하지 않게"
        courseId="CSAT_IDIOMS"
        variant="meaning"
        isMatched={false}
        isSelected={false}
        onPress={jest.fn()}
        isDark={true}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("아주 드물게")).toBeTruthy();
    expect(getByText("거의 하지 않게")).toBeTruthy();
    expect(queryByTestId("matching-meaning-pos-column-0")).toBeNull();
    expect(queryByTestId("matching-meaning-pos-column-1")).toBeNull();
  });

  it("renders numbered extremely advanced meaning cards without the POS gutter", () => {
    const { getByText, queryByTestId } = render(
      <MatchingCard
        text="1. 정교분리 반대론 2. 긴 단어"
        courseId="EXTREMELY_ADVANCED"
        variant="meaning"
        isMatched={false}
        isSelected={false}
        onPress={jest.fn()}
        isDark={true}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("정교분리 반대론")).toBeTruthy();
    expect(getByText("긴 단어")).toBeTruthy();
    expect(queryByTestId("matching-meaning-pos-column-0")).toBeNull();
    expect(queryByTestId("matching-meaning-pos-column-1")).toBeNull();
  });
});
