import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import BackSide from "../components/CollocationFlipCard/BackSide";

const mockExampleSection = jest.fn(() => null);

jest.mock("../components/CollocationFlipCard/ExampleSection", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockExampleSection(props);
    return null;
  },
}));

jest.mock("../components/CollocationFlipCard/ExplanationSection", () => ({
  __esModule: true,
  default: () => null,
}));

describe("BackSide max height behavior", () => {
  beforeEach(() => {
    mockExampleSection.mockClear();
  });

  test("passes 80% maxHeight to ExampleSection after layout measurement", () => {
    const { UNSAFE_getAllByType } = render(
      <BackSide
        data={{
          collocation: "want to",
          meaning: "~하고 싶다",
          explanation: "test explanation",
          example: "Alex: I want to go now.",
          translation: "Jane: 지금 가고 싶어.",
        }}
        isDark={false}
        isVisible={true}
      />,
    );

    expect(mockExampleSection).toHaveBeenCalled();

    const viewNodes = UNSAFE_getAllByType(View);
    const layoutTarget = viewNodes.find(
      (node) => typeof node.props.onLayout === "function",
    );

    expect(layoutTarget).toBeTruthy();

    fireEvent(layoutTarget as any, "layout", {
      nativeEvent: { layout: { height: 500 } },
    });

    const lastCallProps =
      mockExampleSection.mock.calls[mockExampleSection.mock.calls.length - 1][0];
    expect(lastCallProps.maxHeight).toBe(400);

    const hasMinHeightGuard = viewNodes.some((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.minHeight === 0;
    });

    expect(hasMinHeightGuard).toBe(true);
  });
});
