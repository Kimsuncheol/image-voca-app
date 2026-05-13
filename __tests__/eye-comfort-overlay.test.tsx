import { act, render } from "@testing-library/react-native";
import React from "react";
import { EyeComfortImageOverlay } from "../src/components/common/EyeComfortImageOverlay";
import { EyeComfortOverlay } from "../src/components/common/EyeComfortOverlay";
import {
  __resetReadingDisplayStoreForTests,
  useReadingDisplayStore,
} from "../src/stores/readingDisplayStore";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

describe("eye comfort overlays", () => {
  beforeEach(() => {
    __resetReadingDisplayStoreForTests();
    useReadingDisplayStore.setState({
      _initialized: true,
      eyeComfortEnabled: true,
      eyeComfortIntensity: 0.14,
    });
  });

  it("renders the global overlay for screen scope only", () => {
    useReadingDisplayStore.setState({ eyeComfortScope: "screen" });

    expect(render(<EyeComfortOverlay />).getByTestId("eye-comfort-overlay"))
      .toBeTruthy();

    act(() => {
      useReadingDisplayStore.setState({ eyeComfortScope: "images" });
    });

    expect(render(<EyeComfortOverlay />).queryByTestId("eye-comfort-overlay"))
      .toBeNull();
  });

  it("renders the image overlay for images scope only", () => {
    useReadingDisplayStore.setState({ eyeComfortScope: "images" });

    expect(
      render(<EyeComfortImageOverlay />).getByTestId(
        "eye-comfort-image-overlay",
      ),
    ).toBeTruthy();

    act(() => {
      useReadingDisplayStore.setState({ eyeComfortScope: "screen" });
    });

    expect(
      render(<EyeComfortImageOverlay />).queryByTestId(
        "eye-comfort-image-overlay",
      ),
    ).toBeNull();
  });

  it("does not render image overlay when eye comfort is disabled", () => {
    useReadingDisplayStore.setState({
      eyeComfortEnabled: false,
      eyeComfortScope: "images",
    });

    expect(
      render(<EyeComfortImageOverlay />).queryByTestId(
        "eye-comfort-image-overlay",
      ),
    ).toBeNull();
  });
});
