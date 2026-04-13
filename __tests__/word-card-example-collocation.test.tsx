import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { WordCardExample } from "../components/wordbank/WordCardExample";

const mockSpeak = jest.fn();

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      if (key === "common.expand") return "Expand";
      if (key === "common.collapse") return "Collapse";
      return options?.defaultValue ?? key;
    },
  }),
}));

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

describe("WordCardExample collocation layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders character chips and aligns translations by example row", () => {
    const screen = render(
      <WordCardExample
        example="Chip: We should go. Dale: Let's head out."
        translation="Narrator: 가자. Extra: 지금 출발하자."
        course="COLLOCATION"
      />,
    );

    expect(screen.getByText("Chip")).toBeTruthy();
    expect(screen.getByText("Dale")).toBeTruthy();
    expect(screen.getByText("We should go.")).toBeTruthy();
    expect(screen.getByText("Let's head out.")).toBeTruthy();
    expect(screen.getByText("가자.")).toBeTruthy();
    expect(screen.getByText("지금 출발하자.")).toBeTruthy();
    expect(screen.queryByText("Narrator")).toBeNull();
    expect(screen.queryByText("Extra")).toBeNull();
  });

  it("keeps an empty character cell and overflow-safe text column for plain turns", () => {
    const screen = render(
      <WordCardExample
        example="Supercalifragilisticexpialidocious long sentence for overflow checks."
        translation="매우 긴 번역 문장입니다."
        course="COLLOCATION"
      />,
    );

    expect(
      screen.getByText("Supercalifragilisticexpialidocious long sentence for overflow checks."),
    ).toBeTruthy();
    expect(screen.getAllByTestId("word-card-collocation-empty-character-cell")).toHaveLength(1);

    const contentCellStyle = StyleSheet.flatten(
      screen.getAllByTestId("word-card-collocation-content-cell")[0].props.style,
    );

    expect(contentCellStyle.flex).toBe(1);
    expect(contentCellStyle.minWidth).toBe(0);
    expect(contentCellStyle.flexShrink).toBe(1);
  });

  it("shows three rows by default and toggles expand collapse for long collocation examples", () => {
    const screen = render(
      <WordCardExample
        example="Chip: One. Dale: Two. Gadget: Three. Monterey: Four."
        translation="하나. 둘. 셋. 넷."
        course="COLLOCATION"
      />,
    );

    expect(screen.getByText("One.")).toBeTruthy();
    expect(screen.getByText("Two.")).toBeTruthy();
    expect(screen.getByText("Three.")).toBeTruthy();
    expect(screen.queryByText("Four.")).toBeNull();
    expect(screen.getByText("Expand")).toBeTruthy();

    const contentContainerStyle = StyleSheet.flatten(
      screen.getByTestId("word-card-example-content").props.style,
    );
    const toggleStyle = StyleSheet.flatten(
      screen.getByTestId("word-card-example-toggle").props.style,
    );

    expect(contentContainerStyle.borderLeftWidth).toBe(3);
    expect(toggleStyle.marginTop).toBe(12);

    fireEvent.press(screen.getByText("Expand"));

    expect(screen.getByText("Four.")).toBeTruthy();
    expect(screen.getByText("Collapse")).toBeTruthy();

    fireEvent.press(screen.getByText("Collapse"));

    expect(screen.queryByText("Four.")).toBeNull();
  });

  it("keeps TTS working for collocation example rows", () => {
    const screen = render(
      <WordCardExample
        example="Chip: We should go now."
        exampleHurigana="Chip: We should go now."
        translation="지금 가야 해."
        course="COLLOCATION"
      />,
    );

    fireEvent.press(screen.getByText("We should go now."));

    expect(mockSpeak).toHaveBeenCalledWith("We should go now.", {
      language: "en-US",
      pitch: 1,
    });
  });
});
