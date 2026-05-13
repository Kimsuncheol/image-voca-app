import { render } from "@testing-library/react-native";
import React from "react";
import { CollocationCardImage } from "../components/common/CollocationCardImage";
import {
  __resetReadingDisplayStoreForTests,
  useReadingDisplayStore,
} from "../src/stores/readingDisplayStore";

describe("CollocationCardImage eye comfort overlay", () => {
  beforeEach(() => {
    __resetReadingDisplayStoreForTests();
    useReadingDisplayStore.setState({ _initialized: true });
  });

  it("renders the image-only eye comfort overlay inside collocation image frames", () => {
    useReadingDisplayStore.setState({
      eyeComfortEnabled: true,
      eyeComfortScope: "images",
    });

    const screen = render(
      <CollocationCardImage
        imageUrl="https://cdn.example.com/card.jpg"
        isDark={false}
        style={{ width: 120, height: 80 }}
      />,
    );

    expect(screen.getByTestId("mock-expo-image")).toBeTruthy();
    expect(screen.getByTestId("eye-comfort-image-overlay")).toBeTruthy();
  });
});
