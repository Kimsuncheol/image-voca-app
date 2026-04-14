import { render } from "@testing-library/react-native";
import React from "react";
import CollocationFlipCard from "../components/CollocationFlipCard";

jest.mock("react-native-flip-card", () => {
  const React = require("react");
  const { View } = require("react-native");

  return ({ children, style }: any) => (
    <View testID="mock-flip-card" style={style}>
      {children}
    </View>
  );
});

jest.mock("../components/CollocationFlipCard/FaceSide", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: () => <View testID="mock-face-side" />,
  };
});

jest.mock("../components/CollocationFlipCard/BackSide", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: () => <View testID="mock-back-side" />,
  };
});

describe("CollocationFlipCard ad placement", () => {
  it("does not render the top native ad inside the flip card", () => {
    const { queryByTestId } = render(
      <CollocationFlipCard
        data={{
          collocation: "make a decision",
          meaning: "decide something",
          explanation: "example explanation",
          example: "Please make a decision.",
          translation: "결정을 내리세요.",
        }}
      />,
    );

    expect(queryByTestId("mock-top-install-native-ad")).toBeNull();
  });
});
