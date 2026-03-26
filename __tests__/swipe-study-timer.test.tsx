import { render } from "@testing-library/react-native";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { SwipeStudyTimer } from "../components/course/vocabulary/SwipeStudyTimer";

describe("SwipeStudyTimer", () => {
  it("renders elapsed time as mm:ss", () => {
    const screen = render(
      <SwipeStudyTimer elapsedSeconds={0} label="Study Time" isDark={false} />,
    );

    expect(screen.getByText("Study Time")).toBeTruthy();
    expect(screen.getByTestId("swipe-study-timer-value").props.children).toBe("00:00");
    expect(
      StyleSheet.flatten(screen.getByTestId("swipe-study-timer-value").props.style).fontSize,
    ).toBe(12);
    expect(
      StyleSheet.flatten(screen.getByTestId("swipe-study-timer").props.style).borderWidth,
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(screen.getByTestId("swipe-study-timer").props.style).marginTop,
    ).toBe(-(Dimensions.get("window").height / 30));
  });

  it("renders elapsed times beyond one minute", () => {
    const screen = render(
      <SwipeStudyTimer elapsedSeconds={65} label="Study Time" isDark={false} />,
    );

    expect(screen.getByTestId("swipe-study-timer-value").props.children).toBe("01:05");
  });

  it("loops the bar fill every sixty seconds", () => {
    const fiftyNineSeconds = render(
      <SwipeStudyTimer elapsedSeconds={59} label="Study Time" isDark={false} />,
    );
    const sixtySeconds = render(
      <SwipeStudyTimer elapsedSeconds={60} label="Study Time" isDark={false} />,
    );
    const sixtyOneSeconds = render(
      <SwipeStudyTimer elapsedSeconds={61} label="Study Time" isDark={false} />,
    );

    expect(
      StyleSheet.flatten(fiftyNineSeconds.getByTestId("swipe-study-timer-fill").props.style)
        .width,
    ).toBe(`${(59 / 60) * 100}%`);
    expect(
      StyleSheet.flatten(sixtySeconds.getByTestId("swipe-study-timer-fill").props.style)
        .width,
    ).toBe("0%");
    expect(
      StyleSheet.flatten(sixtyOneSeconds.getByTestId("swipe-study-timer-fill").props.style)
        .width,
    ).toBe(`${(1 / 60) * 100}%`);
  });
});
