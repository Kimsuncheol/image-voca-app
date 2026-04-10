import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { WordCardExample } from "../components/wordbank/WordCardExample";

const mockSpeak = jest.fn();

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
  }),
}));

jest.mock("../components/themed-text", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

describe("WordCardExample height behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("keeps the capped scroll layout by default", () => {
    const screen = render(
      <WordCardExample
        example={"1. first\n2. second\n3. third\n4. fourth"}
        translation={"1. 하나\n2. 둘\n3. 셋\n4. 넷"}
      />,
    );

    expect(screen.getByTestId("word-card-example-scroll")).toBeTruthy();
    expect(screen.queryByTestId("word-card-example-content")).toBeNull();
    expect(screen.getByText("Show 1 more")).toBeTruthy();
  });

  test("renders full content without the capped scroll layout when expanded", () => {
    const screen = render(
      <WordCardExample
        example={"1. first\n2. second\n3. third\n4. fourth"}
        translation={"1. 하나\n2. 둘\n3. 셋\n4. 넷"}
        expandToContent={true}
      />,
    );

    expect(screen.getByTestId("word-card-example-content")).toBeTruthy();
    expect(screen.queryByTestId("word-card-example-scroll")).toBeNull();
    expect(screen.queryByText("Show 1 more")).toBeNull();
    expect(screen.getByText("fourth")).toBeTruthy();
  });

  test("keeps example TTS working in the expanded layout", () => {
    const screen = render(
      <WordCardExample
        example="1. expanded example"
        translation="1. 확장 예문"
        expandToContent={true}
      />,
    );

    fireEvent.press(screen.getByText("expanded example"));

    expect(mockSpeak).toHaveBeenCalledWith("expanded example", {
      language: "en-US",
      pitch: 1,
    });
  });
});
