import { render } from "@testing-library/react-native";
import React from "react";
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
});
