import { render } from "@testing-library/react-native";
import React from "react";
import { MangaPageView } from "../components/manga/MangaPageView";

const mockResumableZoom = jest.fn();

jest.mock("expo-image", () => ({
  Image: ({ source, style }: any) => {
    const ReactModule = require("react");
    const { View } = require("react-native");
    return (
      <View
        testID="mock-expo-image"
        source={source}
        style={style}
      />
    );
  },
}));

jest.mock("react-native-zoom-toolkit", () => ({
  ResumableZoom: (props: any) => {
    mockResumableZoom(props);
    const ReactModule = require("react");
    const { View } = require("react-native");
    return <View testID="mock-resumable-zoom">{props.children}</View>;
  },
}));

describe("MangaPageView", () => {
  beforeEach(() => {
    mockResumableZoom.mockClear();
  });

  it("renders the image inside ResumableZoom without throwing", () => {
    const screen = render(
      <MangaPageView uri="https://cdn.example.com/manga-page-1.png" />,
    );

    expect(screen.getByTestId("mock-resumable-zoom")).toBeTruthy();
    expect(screen.getByTestId("mock-expo-image").props.source).toEqual({
      uri: "https://cdn.example.com/manga-page-1.png",
    });
  });

  it("wires horizontal swipe callbacks through ResumableZoom", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const onTap = jest.fn();

    render(
      <MangaPageView
        uri="https://cdn.example.com/manga-page-1.png"
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        onTap={onTap}
      />,
    );

    const props = mockResumableZoom.mock.calls.at(-1)?.[0];
    expect(props?.onSwipe).toEqual(expect.any(Function));
    expect(props?.onTap).toEqual(expect.any(Function));

    props.onSwipe("left");
    props.onSwipe("right");
    props.onSwipe("up");
    props.onTap();

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
