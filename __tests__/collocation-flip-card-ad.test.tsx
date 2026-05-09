import { render } from "@testing-library/react-native";
import React from "react";
import CollocationFlipCard from "../components/CollocationFlipCard";

const mockFaceSide = jest.fn();
const mockBackSide = jest.fn();

jest.mock("react-native-flip-card", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockFlipCard = ({ children, style }: any) => (
    <View testID="mock-flip-card" style={style}>
      {children}
    </View>
  );
  MockFlipCard.displayName = "MockFlipCard";

  return MockFlipCard;
});

jest.mock("../components/CollocationFlipCard/FaceSide", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: (props: unknown) => {
      mockFaceSide(props);
      return <View testID="mock-face-side" />;
    },
  };
});

jest.mock("../components/CollocationFlipCard/BackSide", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: (props: unknown) => {
      mockBackSide(props);
      return <View testID="mock-back-side" />;
    },
  };
});

describe("CollocationFlipCard ad placement", () => {
  beforeEach(() => {
    mockFaceSide.mockClear();
    mockBackSide.mockClear();
  });

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

  it("passes independent face and back mask state to each side", () => {
    render(
      <CollocationFlipCard
        data={{
          collocation: "make a decision",
          meaning: "decide something",
          explanation: "example explanation",
          example: "Please make a decision.",
          translation: "결정을 내리세요.",
        }}
        isFaceReviewMode={true}
        isBackReviewMode={false}
        onFaceMaskChange={jest.fn()}
        onBackMaskChange={jest.fn()}
      />,
    );

    expect(mockFaceSide).toHaveBeenCalledWith(
      expect.objectContaining({ isReviewMode: true }),
    );
    expect(mockBackSide).toHaveBeenCalledWith(
      expect.objectContaining({ isReviewMode: false }),
    );
  });

  it("passes independent face and back mask callbacks to each side", () => {
    const onFaceMaskChange = jest.fn();
    const onBackMaskChange = jest.fn();

    render(
      <CollocationFlipCard
        data={{
          collocation: "make a decision",
          meaning: "decide something",
          explanation: "example explanation",
          example: "Please make a decision.",
          translation: "결정을 내리세요.",
        }}
        onFaceMaskChange={onFaceMaskChange}
        onBackMaskChange={onBackMaskChange}
      />,
    );

    expect(mockFaceSide).toHaveBeenCalledWith(
      expect.objectContaining({ onMaskChange: onFaceMaskChange }),
    );
    expect(mockBackSide).toHaveBeenCalledWith(
      expect.objectContaining({ onMaskChange: onBackMaskChange }),
    );
  });
});
