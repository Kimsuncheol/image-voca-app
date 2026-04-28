import { render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SwipeCardItemImageSection } from "../components/swipe/SwipeCardItemImageSection";

describe("SwipeCardItemImageSection", () => {
  it("renders an image when imageUrl is provided", () => {
    const { getByTestId, queryByTestId } = render(
      <SwipeCardItemImageSection
        imageUrl="https://cdn.example.com/card.jpg"
        isDark={false}
      />,
    );

    const image = getByTestId("mock-expo-image");

    expect(image.props.source).toEqual({
      uri: "https://cdn.example.com/card.jpg",
    });
    expect(image.props.contentFit).toBe("cover");
    expect(image.props.cachePolicy).toBe("memory-disk");
    expect(queryByTestId("icon-image-outline")).toBeNull();
  });

  it("renders the placeholder icon when imageUrl is missing", () => {
    const { getByTestId } = render(
      <SwipeCardItemImageSection isDark={false} />,
    );

    expect(getByTestId("icon-image-outline")).toBeTruthy();
  });

  it("renders the top-right overlay inside the image section", () => {
    const ReactModule = require("react");
    const { Text } = require("react-native");
    const { getByTestId, getByText } = render(
      <SwipeCardItemImageSection
        isDark={false}
        topRightOverlay={<Text>save</Text>}
      />,
    );

    expect(getByTestId("swipe-card-image-top-right-overlay")).toBeTruthy();
    expect(getByText("save")).toBeTruthy();
  });

  it("uses the tight content top inset for the image content area", () => {
    const { UNSAFE_getByType } = render(
      <SwipeCardItemImageSection isDark={false} />,
    );

    const containerStyle = StyleSheet.flatten(UNSAFE_getByType(View).props.style);

    expect(containerStyle).toEqual(
      expect.objectContaining({
        paddingHorizontal: 4,
        paddingTop: 10,
      }),
    );
  });
});
